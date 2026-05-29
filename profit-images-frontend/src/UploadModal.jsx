import { useState, useRef, useEffect } from 'react';

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCloud = () => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export function UploadModal({ onUpload, onBulkUpload, onClose, defaultPrefix = '' }) {
  const [files, setFiles]       = useState([]);
  const [key, setKey]           = useState('');
  const [uploadStats, setUploadStats] = useState({ percent: 0, completed: 0, total: 0, eta: null, rate: 0 });
  const [uploading, setUploading] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError]       = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef();
  const abortRef = useRef(null);

  const fmtEta = (secs) => {
    if (!secs || secs < 1) return null;
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60), s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setCancelled(true);
  };

  const isBulk   = files.length > 1;
  const isSingle = files.length === 1;
  const fmt = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
  const totalSize = files.reduce((a, f) => a + f.size, 0);

  // Create/revoke preview URL — avoids blob URL leak on re-render
  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    if (files.length !== 1) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(files[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [files]);

  const handleFiles = (incoming) => {
    const arr = Array.from(incoming);
    setFiles(arr);
    if (arr.length === 1) setKey(defaultPrefix + arr[0].name);
    else setKey('');
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true); setError(null); setCancelled(false);
    setUploadStats({ percent: 0, completed: 0, total: files.length, eta: null, rate: 0 });
    try {
      if (isBulk) {
        await onBulkUpload(files, defaultPrefix, (info) => {
          if (typeof info === 'number') setUploadStats((p) => ({ ...p, percent: info }));
          else setUploadStats(info);
        }, controller.signal);
      } else {
        if (!key) return;
        await onUpload(key, files[0], (pct) => setUploadStats({ percent: pct, completed: pct === 100 ? 1 : 0, total: 1, eta: null, rate: 0 }));
      }
      onClose();
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Carga cancelada.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setUploading(false);
      setUploadStats({ percent: 0, completed: 0, total: 0, eta: null, rate: 0 });
      abortRef.current = null;
    }
  };

  const canSubmit = files.length > 0 && (isBulk || key) && !uploading;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h2 style={s.title}>{isBulk ? `Subir ${files.length} imágenes` : 'Subir imagen'}</h2>
            {defaultPrefix && (
              <p style={s.subtitle}>Carpeta: <code style={s.code}>{defaultPrefix}</code></p>
            )}
          </div>
          <button style={s.btnClose} onClick={onClose}><IconX/></button>
        </div>

        <div style={s.body}>
          {/* Drop zone */}
          <div
            style={{ ...s.drop, ...(dragOver ? s.dropActive : {}), ...(files.length ? s.dropFilled : {}) }}
            onClick={() => !uploading && inputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
          >
            {files.length === 0 && (
              <div style={s.dropEmpty}>
                <div style={s.dropIcon}><IconCloud/></div>
                <p style={s.dropTitle}>Arrastra imágenes aquí</p>
                <p style={s.dropHint}>
                  o <span style={s.dropLink}>selecciona archivos</span>
                  <br/>JPEG, PNG, WebP, GIF, SVG
                </p>
              </div>
            )}

            {isSingle && (
              <div style={s.singleRow}>
                <img src={previewUrl} alt="preview" style={s.previewImg}/>
                <div style={s.previewInfo}>
                  <p style={s.previewName}>{files[0].name}</p>
                  <p style={s.previewSize}>{fmt(files[0].size)}</p>
                  <button style={s.changeBtn} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
                    Cambiar archivo
                  </button>
                </div>
              </div>
            )}

            {isBulk && (
              <div style={s.bulkRow}>
                <div style={s.bulkBadge}>
                  <span style={s.bulkNum}>{files.length}</span>
                  <span style={s.bulkLabel}>archivos</span>
                </div>
                <div>
                  <p style={s.previewName}>{fmt(totalSize)} total</p>
                  <p style={s.previewSize}>
                    {files.slice(0,3).map(f => f.name).join(', ')}
                    {files.length > 3 && ` y ${files.length - 3} más`}
                  </p>
                  <button style={s.changeBtn} onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}>
                    Cambiar selección
                  </button>
                </div>
              </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }}
              onChange={(e) => e.target.files.length && handleFiles(e.target.files)}/>
          </div>

          {/* Key (single) */}
          {isSingle && (
            <div style={s.field}>
              <label style={s.label}>Ruta en el bucket</label>
              <input
                style={s.input} value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={`${defaultPrefix}nombre-imagen.jpg`}
              />
              <p style={s.hint}>Si la ruta ya existe la imagen se sobreescribirá.</p>
            </div>
          )}

          {/* Bulk info */}
          {isBulk && (
            <div style={s.infoBox}>
              <span style={{ color:'var(--teal-600)' }}><IconInfo/></span>
              Los archivos se subirán con sus nombres originales al prefijo{' '}
              <code style={s.code}>{defaultPrefix || '/'}</code>
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div style={s.progressWrap}>
              <div style={s.progressMeta}>
                <span style={s.progressFiles}>
                  {uploadStats.completed} / {uploadStats.total} archivo{uploadStats.total !== 1 ? 's' : ''}
                  {uploadStats.rate > 0 && (
                    <span style={s.progressRate}> · {uploadStats.rate.toFixed(1)}/s</span>
                  )}
                </span>
                <span style={s.progressRight}>
                  {fmtEta(uploadStats.eta) && (
                    <span style={s.progressEta}>~{fmtEta(uploadStats.eta)} restante</span>
                  )}
                  <span style={s.progressPct}>{uploadStats.percent}%</span>
                </span>
              </div>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width:`${uploadStats.percent}%` }}/>
              </div>
            </div>
          )}

          {error && <div style={s.errorBox}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {uploading ? (
            <button style={s.btnDanger} onClick={handleCancel} disabled={cancelled}>
              {cancelled ? 'Cancelando...' : 'Cancelar carga'}
            </button>
          ) : (
            <button style={s.btnCancel} onClick={onClose}>Cancelar</button>
          )}
          <button
            style={{ ...s.btnSubmit, ...(!canSubmit ? s.btnOff : {}) }}
            onClick={handleSubmit} disabled={!canSubmit}
          >
            {uploading ? 'Subiendo...' : isBulk ? `Subir ${files.length} archivos` : 'Subir imagen'}
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(10,36,34,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'var(--surface)', borderRadius: 'var(--r-xl)',
    width: 500, maxWidth: '95vw', boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
  },

  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '24px 24px 0',
  },
  title: { fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' },
  subtitle: { fontSize: 12, color: 'var(--text-muted)', marginTop: 4 },
  code: { fontFamily: 'monospace', color: 'var(--teal-600)', fontStyle: 'normal' },
  btnClose: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)',
    cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 'var(--r-xs)',
  },

  body: { padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 },

  drop: {
    border: '2px dashed var(--border)', borderRadius: 'var(--r-lg)',
    cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
    minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dropActive: { borderColor: 'var(--teal-500)', background: 'rgba(47,187,168,0.05)' },
  dropFilled: { border: '1.5px solid var(--border)', background: 'var(--surface-2)', cursor: 'default', minHeight: 'auto' },
  dropEmpty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px', width: '100%' },
  dropIcon: { color: 'var(--teal-500)', opacity: 0.7 },
  dropTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  dropHint: { fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 },
  dropLink: { color: 'var(--teal-600)', fontWeight: 600 },

  singleRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', width: '100%' },
  previewImg: {
    width: 72, height: 72, objectFit: 'cover',
    borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', flexShrink: 0,
  },
  previewInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  previewName: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  previewSize: { fontSize: 11, color: 'var(--text-muted)' },

  bulkRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', width: '100%' },
  bulkBadge: {
    width: 60, height: 60, background: 'var(--teal-600)',
    borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(26,152,136,0.3)',
  },
  bulkNum: { fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1 },
  bulkLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 500, marginTop: 2 },

  changeBtn: {
    background: 'none', border: 'none', color: 'var(--teal-600)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '4px 0',
    fontFamily: 'inherit', marginTop: 4,
  },

  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.2px' },
  input: {
    padding: '10px 13px', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-sm)', fontSize: 13,
    color: 'var(--text-primary)', fontFamily: 'monospace',
    background: 'var(--surface)', transition: 'border-color 0.15s',
  },
  hint: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 },

  infoBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', background: 'rgba(47,187,168,0.08)',
    borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--text-secondary)',
  },

  progressWrap: { display: 'flex', flexDirection: 'column', gap: 8 },
  progressMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  progressFiles: { fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 },
  progressRate: { color: 'var(--text-muted)', fontWeight: 400 },
  progressRight: { display: 'flex', alignItems: 'center', gap: 10 },
  progressEta: { fontSize: 11, color: 'var(--text-muted)' },
  progressPct: { fontSize: 12, color: 'var(--teal-600)', fontWeight: 600 },
  progressTrack: { height: 6, background: 'var(--border-soft)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--teal-600)', transition: 'width 0.25s', borderRadius: 3 },

  errorBox: {
    padding: '10px 14px', background: 'var(--danger-soft)',
    border: '1px solid var(--danger-border)', borderRadius: 'var(--r-sm)',
    color: 'var(--danger)', fontSize: 12,
  },

  footer: {
    display: 'flex', gap: 8, justifyContent: 'flex-end',
    padding: '16px 24px 22px', borderTop: '1px solid var(--border-soft)',
  },
  btnCancel: {
    padding: '9px 20px', fontSize: 13, fontWeight: 500, background: 'transparent',
    color: 'var(--text-secondary)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDanger: {
    padding: '9px 20px', fontSize: 13, fontWeight: 600,
    background: 'var(--danger-soft)', color: 'var(--danger)',
    border: '1.5px solid var(--danger-border)',
    borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSubmit: {
    padding: '9px 24px', fontSize: 13, fontWeight: 600,
    background: 'var(--teal-600)', color: '#fff', border: 'none',
    borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(26,152,136,0.35)',
    transition: 'background 0.15s',
  },
  btnOff: { opacity: 0.5, cursor: 'not-allowed' },
};
