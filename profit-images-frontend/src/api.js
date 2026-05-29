import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export const login = (username, password) =>
  axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/login`, { username, password });

export const listFolders = (prefix = '') =>
  api.get('/images/folders', { params: { prefix } });

export const listImages = (prefix = '', limit = 1000, cursor = null) =>
  api.get('/images', { params: { prefix, limit, cursor } });

export const uploadImage = (key, file, onProgress) => {
  const form = new FormData();
  form.append('key', key);
  form.append('image', file);
  return api.post('/images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  });
};

const PRESIGN_BATCH = 500; // filenames per presign request (pure metadata, no file data)
const UPLOAD_CONCURRENCY = 10; // simultaneous PUT requests to S3

// Upload files directly to S3 via presigned URLs — backend never buffers file data.
// onProgress receives { percent, completed, total }
export const bulkUploadPresigned = async (files, prefix, onProgress) => {
  const allFiles = Array.from(files);
  const total = allFiles.length;
  let completed = 0;

  // Step 1: get presigned URLs from backend in batches (just metadata)
  const allPresigned = [];
  for (let i = 0; i < allFiles.length; i += PRESIGN_BATCH) {
    const batch = allFiles.slice(i, i + PRESIGN_BATCH);
    const { data } = await api.post('/images/presign', {
      files: batch.map((f) => ({ filename: f.name, contentType: f.type || 'application/octet-stream' })),
      prefix,
    });
    allPresigned.push(...data.presigned);
  }

  // Step 2: upload each file directly to S3 with bounded concurrency
  const pairs = allFiles.map((file, i) => ({ file, ...allPresigned[i] }));
  const results = [];

  for (let i = 0; i < pairs.length; i += UPLOAD_CONCURRENCY) {
    const chunk = pairs.slice(i, i + UPLOAD_CONCURRENCY);
    await Promise.all(
      chunk.map(async ({ file, key, uploadUrl, cdnUrl }) => {
        const resp = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
        if (!resp.ok) throw new Error(`S3 upload failed for ${file.name}: ${resp.status}`);
        completed++;
        onProgress?.({ percent: Math.round((completed / total) * 100), completed, total });
        results.push({ key, url: cdnUrl, size: file.size, contentType: file.type });
      })
    );
  }

  return { data: { uploaded: results, count: results.length } };
};

const DELETE_CHUNK = 1000;

export const bulkDelete = async (keys, onProgress) => {
  const total = keys.length;
  const chunks = [];
  for (let i = 0; i < total; i += DELETE_CHUNK) {
    chunks.push(keys.slice(i, i + DELETE_CHUNK));
  }

  const allDeleted = [];
  const allErrors = [];

  for (let i = 0; i < chunks.length; i++) {
    const { data } = await api.delete('/images/bulk', { data: { keys: chunks[i] } });
    allDeleted.push(...(data.deleted || []));
    allErrors.push(...(data.errors || []));
    onProgress?.(Math.round(((i + 1) / chunks.length) * 100));
  }

  return { data: { deleted: allDeleted, errors: allErrors, count: allDeleted.length } };
};

export const deleteImage = (key) =>
  api.delete(`/images/${key.split('/').map(encodeURIComponent).join('/')}`);
