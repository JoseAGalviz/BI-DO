import { useState, useCallback } from 'react';
import { listFolders, listImages, uploadImage, bulkUploadPresigned, bulkDelete, deleteImage } from './api';

export function useImages() {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async (prefix = '') => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listFolders(prefix);
      setFolders(data.folders);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetches ALL pages automatically — no manual "load more" needed
  const fetchImages = useCallback(async (prefix = '') => {
    setLoading(true);
    setError(null);
    setImages([]);
    try {
      let all = [];
      let cursor = null;
      do {
        const { data } = await listImages(prefix, 1000, cursor);
        all = all.concat(data.images);
        cursor = data.nextCursor;
      } while (cursor);
      setImages(all);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const upload = useCallback(async (key, file, onProgress) => {
    const { data } = await uploadImage(key, file, onProgress);
    setImages((prev) => {
      const idx = prev.findIndex((img) => img.key === key);
      if (idx >= 0) { const n = [...prev]; n[idx] = data; return n; }
      return [data, ...prev];
    });
    return data;
  }, []);

  const uploadMany = useCallback(async (files, prefix, onProgress) => {
    const { data } = await bulkUploadPresigned(Array.from(files), prefix, onProgress);
    setImages((prev) => {
      const existing = new Set(prev.map((i) => i.key));
      const newItems = data.uploaded.filter((i) => !existing.has(i.key));
      const updated = prev.map((i) => {
        const match = data.uploaded.find((u) => u.key === i.key);
        return match || i;
      });
      return [...newItems, ...updated];
    });
    return data;
  }, []);

  const remove = useCallback(async (key) => {
    await deleteImage(key);
    setImages((prev) => prev.filter((img) => img.key !== key));
  }, []);

  const removeMany = useCallback(async (keys, onProgress) => {
    const { data } = await bulkDelete(keys, onProgress);
    const deletedSet = new Set(data.deleted);
    setImages((prev) => prev.filter((img) => !deletedSet.has(img.key)));
    return data;
  }, []);

  return {
    folders, images, loading, error,
    fetchFolders, fetchImages, upload, uploadMany, remove, removeMany,
  };
}
