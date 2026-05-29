import { useState } from 'react';

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);
const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export function ImageCard({ image, onDelete, selected, onToggleSelect, selectionMode }) {
  const [confirm, setConfirm]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered]   = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(image.key); }
    finally { setDeleting(false); setConfirm(false); }
  };

  const copyUrl = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(image.url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = image.url;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (b) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
  const fileName = image.key.split('/').pop();
  const showOverlay = hovered || selected;

  return (
    <div
      style={{ ...s.card, ...(selected ? s.cardSel : {}), ...(selectionMode ? { cursor: 'pointer' } : {}) }}
      onClick={selectionMode ? () => onToggleSelect(image.key) : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div style={s.thumb}>
        {imgError ? (
          <div style={s.fallback}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        ) : (
          <img src={image.url} alt={fileName} style={s.img} loading="lazy" onError={() => setImgError(true)}/>
        )}

        {/* Checkbox overlay */}
        <div
          style={{ ...s.overlay, opacity: showOverlay ? 1 : 0 }}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(image.key); }}
        >
          <div style={{ ...s.checkbox, ...(selected ? s.checkboxOn : {}) }}>
            {selected && <IconCheck/>}
          </div>
        </div>

        {/* Size pill */}
        <div style={s.sizePill}>{fmt(image.size)}</div>
      </div>

      {/* Info */}
      <div style={s.info}>
        <p style={s.fileName} title={image.key}>{fileName}</p>
      </div>

      {/* Actions */}
      {!selectionMode && (
        <div style={s.actions}>
          {!confirm ? (
            <>
              <button style={s.btnCopy} onClick={copyUrl}>
                <IconCopy/>
                {copied ? 'Copiada' : 'Copiar URL'}
              </button>
              <button style={s.btnDel} onClick={(e) => { e.stopPropagation(); setConfirm(true); }}>
                <IconTrash/>
              </button>
            </>
          ) : (
            <div style={s.confirmRow}>
              <span style={s.confirmLabel}>¿Eliminar?</span>
              <button style={s.btnYes} onClick={handleDelete} disabled={deleting}>
                {deleting ? '...' : 'Sí'}
              </button>
              <button style={s.btnNo} onClick={() => setConfirm(false)}>No</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    background: 'var(--surface)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-lg)', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-sm)',
    transition: 'box-shadow 0.15s, border-color 0.15s, transform 0.12s',
  },
  cardSel: {
    borderColor: 'var(--teal-500)',
    boxShadow: '0 0 0 3px rgba(47,187,168,0.2)',
    transform: 'scale(0.985)',
  },

  thumb: {
    position: 'relative', paddingTop: '72%',
    background: 'var(--surface-2)', overflow: 'hidden',
  },
  img: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  fallback: {
    position: 'absolute', inset: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', background: 'var(--border-soft)',
  },

  overlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(10,34,32,0.3)',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
    padding: 10, transition: 'opacity 0.15s', cursor: 'pointer',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    border: '2px solid rgba(255,255,255,0.8)',
    background: 'rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, border-color 0.15s',
    backdropFilter: 'blur(4px)',
  },
  checkboxOn: { background: 'var(--teal-600)', borderColor: 'var(--teal-600)' },

  sizePill: {
    position: 'absolute', bottom: 8, right: 8,
    fontSize: 10, fontWeight: 600, color: '#fff',
    background: 'rgba(10,34,32,0.55)', backdropFilter: 'blur(6px)',
    borderRadius: 'var(--r-full)', padding: '2px 8px',
  },

  info: { padding: '10px 12px 8px' },
  fileName: {
    fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },

  actions: {
    padding: '6px 10px 10px', borderTop: '1px solid var(--border-soft)',
    display: 'flex', gap: 6,
  },
  btnCopy: {
    display: 'inline-flex', alignItems: 'center', gap: 5, flex: 1,
    justifyContent: 'center', fontSize: 11, fontWeight: 500,
    color: 'var(--teal-600)', background: 'rgba(47,187,168,0.08)',
    border: '1px solid rgba(47,187,168,0.2)', borderRadius: 'var(--r-sm)',
    padding: '6px 8px', cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 0.12s',
  },
  btnDel: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 30, flexShrink: 0, color: 'var(--text-muted)',
    background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit',
  },

  confirmRow: { display: 'flex', alignItems: 'center', gap: 6, width: '100%' },
  confirmLabel: { fontSize: 11, color: 'var(--danger)', fontWeight: 500, flex: 1 },
  btnYes: {
    fontSize: 11, padding: '4px 12px', borderRadius: 'var(--r-full)',
    background: 'var(--danger)', color: '#fff', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
  },
  btnNo: {
    fontSize: 11, padding: '4px 10px', borderRadius: 'var(--r-full)',
    background: 'transparent', color: 'var(--text-muted)',
    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
  },
};
