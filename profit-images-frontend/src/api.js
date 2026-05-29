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

const QUEUE_CHUNK = 50;       // files per presign+upload cycle — keeps memory flat
const UPLOAD_CONCURRENCY = 8; // simultaneous S3 PUTs within a chunk

// Queue-based upload: presign + upload QUEUE_CHUNK files at a time.
// Memory usage stays constant regardless of total file count.
// onProgress receives { percent, completed, total, eta, rate }
// signal: AbortSignal for cancellation
export const bulkUploadPresigned = async (files, prefix, onProgress, signal) => {
  const allFiles = Array.from(files);
  const total = allFiles.length;
  let completed = 0;
  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < allFiles.length; i += QUEUE_CHUNK) {
    if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');

    const chunk = allFiles.slice(i, i + QUEUE_CHUNK);

    // Presign only this chunk
    const { data } = await api.post('/images/presign', {
      files: chunk.map((f) => ({ filename: f.name, contentType: f.type || 'application/octet-stream' })),
      prefix,
    }, { signal });

    const pairs = chunk.map((file, j) => ({ file, ...data.presigned[j] }));

    // Upload chunk with bounded concurrency
    for (let j = 0; j < pairs.length; j += UPLOAD_CONCURRENCY) {
      if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
      const batch = pairs.slice(j, j + UPLOAD_CONCURRENCY);
      await Promise.all(batch.map(async ({ file, key, uploadUrl, cdnUrl }) => {
        const resp = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
          signal,
        });
        if (!resp.ok) throw new Error(`S3 upload failed for ${file.name}: ${resp.status}`);
        completed++;
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = elapsed > 0.5 ? completed / elapsed : 0;
        const eta = rate > 0 ? Math.round((total - completed) / rate) : null;
        onProgress?.({ percent: Math.round((completed / total) * 100), completed, total, eta, rate });
        results.push({ key, url: cdnUrl, size: file.size, contentType: file.type });
      }));
    }
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
