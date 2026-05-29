const express = require('express');
const multer = require('multer');
const {
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3 = require('./s3');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const BUCKET = process.env.DO_BUCKET;
const CDN_BASE = process.env.DO_CDN_BASE;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

// Encode each path segment but preserve slashes
const cdnUrl = (key) =>
  `${CDN_BASE}/${key.split('/').map(encodeURIComponent).join('/')}`;
const S3_DELETE_CHUNK = 1000; // S3 hard limit per DeleteObjects call

// LIST FOLDERS — GET /images/folders?prefix=
router.get('/folders', async (req, res) => {
  try {
    const { prefix = '' } = req.query;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: '/',
    });
    const data = await s3.send(command);
    const folders = (data.CommonPrefixes || []).map((p) => ({
      prefix: p.Prefix,
      name: p.Prefix.replace(prefix, '').replace(/\/$/, ''),
    }));
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LIST IMAGES — GET /images?prefix=folder/&limit=1000&cursor=token
router.get('/', async (req, res) => {
  try {
    const { prefix = '', limit = 1000, cursor } = req.query;
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      Delimiter: '/',
      MaxKeys: Math.min(Number(limit), 1000), // S3 hard cap is 1000
      ContinuationToken: cursor || undefined,
    });
    const data = await s3.send(command);
    const images = (data.Contents || [])
      .filter((obj) => !obj.Key.endsWith('/'))
      .map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        url: cdnUrl(obj.Key),
      }));
    res.json({
      images,
      count: images.length,
      nextCursor: data.NextContinuationToken || null,
      isTruncated: data.IsTruncated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PRESIGN — POST /images/presign
// Body: { files: [{filename, contentType}], prefix }
// Returns: { presigned: [{key, uploadUrl, cdnUrl}] }
// Browser uploads directly to S3 — backend never buffers the file data.
router.post('/presign', async (req, res) => {
  try {
    const { files, prefix = '' } = req.body;
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files array is required' });
    }
    const invalid = files.find((f) => !ALLOWED_TYPES.includes(f.contentType));
    if (invalid) {
      return res.status(400).json({ error: `Tipo no soportado: ${invalid.contentType}` });
    }
    const presigned = await Promise.all(
      files.map(async ({ filename, contentType }) => {
        const key = `${prefix}${filename}`;
        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: contentType || 'application/octet-stream',
          ACL: 'public-read',
        });
        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return { key, uploadUrl, cdnUrl: cdnUrl(key) };
      })
    );
    res.json({ presigned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPLOAD / OVERWRITE — POST /images (single)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { key } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    if (!key) return res.status(400).json({ error: 'key is required' });
    if (!ALLOWED_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: `Unsupported type: ${req.file.mimetype}` });
    }
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key,
      Body: req.file.buffer, ContentType: req.file.mimetype, ACL: 'public-read',
    }));
    res.status(201).json({
      key, url: cdnUrl(key),
      size: req.file.size, contentType: req.file.mimetype,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BULK UPLOAD — POST /images/bulk
// Max 200 files per request (frontend chunks larger sets).
// Uploads with concurrency=10 to avoid S3 rate limits and OOM.
const UPLOAD_CONCURRENCY = 10;
const UPLOAD_BATCH_LIMIT = 200;

router.post('/bulk', upload.array('images', UPLOAD_BATCH_LIMIT), async (req, res) => {
  try {
    const files = req.files;
    const prefix = req.body.prefix || '';

    if (!files || files.length === 0) return res.status(400).json({ error: 'No files provided' });

    const invalid = files.find((f) => !ALLOWED_TYPES.includes(f.mimetype));
    if (invalid) return res.status(400).json({ error: `Tipo no soportado: ${invalid.mimetype}` });

    // Upload with bounded concurrency — prevents OOM and S3 rate limiting
    const results = [];
    for (let i = 0; i < files.length; i += UPLOAD_CONCURRENCY) {
      const chunk = files.slice(i, i + UPLOAD_CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (file) => {
          const key = `${prefix}${file.originalname}`;
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET, Key: key,
            Body: file.buffer, ContentType: file.mimetype, ACL: 'public-read',
          }));
          return { key, url: cdnUrl(key), size: file.size, contentType: file.mimetype };
        })
      );
      results.push(...chunkResults);
    }

    res.status(201).json({ uploaded: results, count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BULK DELETE — DELETE /images/bulk  body: { keys: [...] }
// Chunks automatically at 1000 (S3 hard limit per call)
router.delete('/bulk', async (req, res) => {
  try {
    const { keys } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'keys array is required' });
    }

    const chunks = [];
    for (let i = 0; i < keys.length; i += S3_DELETE_CHUNK) {
      chunks.push(keys.slice(i, i + S3_DELETE_CHUNK));
    }

    const results = await Promise.all(
      chunks.map((chunk) =>
        s3.send(new DeleteObjectsCommand({
          Bucket: BUCKET,
          Delete: { Objects: chunk.map((k) => ({ Key: k })), Quiet: false },
        }))
      )
    );

    const deleted = results.flatMap((r) => (r.Deleted || []).map((d) => d.Key));
    const errors = results.flatMap((r) => r.Errors || []);

    res.json({ deleted, errors, count: deleted.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SINGLE DELETE — DELETE /images/:key
router.delete('/*key', async (req, res) => {
  try {
    const key = req.params.key;
    if (!key) return res.status(400).json({ error: 'key is required' });
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch {
      return res.status(404).json({ error: `Not found: ${key}` });
    }
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    res.json({ deleted: key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
