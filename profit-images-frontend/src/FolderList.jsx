const IconFolder = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconChevron = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export function FolderList({ folders, loading, onSelect }) {
  if (loading) {
    return (
      <div style={s.grid}>
        {[1,2,3,4].map((i) => <div key={i} style={s.skeleton}/>)}
      </div>
    );
  }

  if (!folders.length) {
    return (
      <div style={s.empty}>
        <IconFolder/>
        <p style={s.emptyText}>No se encontraron carpetas en el bucket.</p>
      </div>
    );
  }

  return (
    <div style={s.list}>
      {folders.map((folder, i) => (
        <button
          key={folder.prefix}
          style={{ ...s.row, ...(i < folders.length - 1 ? s.rowDivider : {}) }}
          onClick={() => onSelect(folder)}
        >
          <div style={s.rowLeft}>
            <div style={s.iconWrap}>
              <IconFolder/>
            </div>
            <div>
              <div style={s.name}>{folder.name}</div>
              <div style={s.path}>{folder.prefix}</div>
            </div>
          </div>
          <div style={s.rowRight}>
            <span style={s.badge}>Carpeta</span>
            <span style={s.chevron}><IconChevron/></span>
          </div>
        </button>
      ))}
    </div>
  );
}

const s = {
  list: {
    background: 'var(--surface)', borderRadius: 'var(--r-lg)',
    border: '1px solid var(--border)', overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', width: '100%', background: 'transparent',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
    transition: 'background 0.12s',
  },
  rowDivider: { borderBottom: '1px solid var(--border-soft)' },
  rowLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  iconWrap: {
    width: 46, height: 46, borderRadius: 'var(--r-sm)',
    background: 'rgba(47,187,168,0.08)', border: '1px solid rgba(47,187,168,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--teal-600)', flexShrink: 0,
  },
  name: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' },
  path: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' },
  rowRight: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: {
    fontSize: 11, fontWeight: 500, color: 'var(--teal-600)',
    background: 'rgba(47,187,168,0.1)', border: '1px solid rgba(47,187,168,0.25)',
    borderRadius: 'var(--r-full)', padding: '3px 10px',
  },
  chevron: { color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  skeleton: {
    height: 78, borderRadius: 'var(--r-lg)', background: 'var(--border-soft)',
  },
  empty: {
    padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    background: 'var(--surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
  },
  emptyText: { fontSize: 13 },
};
