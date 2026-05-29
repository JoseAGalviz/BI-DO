import { useState, useEffect } from 'react';
import { useImages } from './useImages';
import { useVirtualGrid } from './useVirtualGrid';
import { FolderList } from './FolderList';
import { ImageCard } from './ImageCard';
import { UploadModal } from './UploadModal';
import { LoginPage } from './LoginPage';

/* ── Icons ── */
const IcoFolder = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoChevron = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const IcoUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcoLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);
const IcoImage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

export default function App() {
  const { folders, images, loading, error, fetchFolders, fetchImages, upload, uploadMany, remove, removeMany } = useImages();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showUpload, setShowUpload]       = useState(false);
  const [selected, setSelected]           = useState(new Set());
  const [bulkDeleting, setBulkDeleting]   = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [confirmDel, setConfirmDel]       = useState(false);
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token');
    return t ? { token: t } : null;
  });

  useEffect(() => {
    if (!user) return;
    setSelected(new Set());
    if (currentFolder === null) fetchFolders('');
    else fetchImages(currentFolder.prefix);
  }, [currentFolder, user]);

  const handleLogout = () => { localStorage.removeItem('token'); setUser(null); };

  const toggleSelect = (key) => setSelected((prev) => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });

  const toggleAll = () =>
    setSelected(selected.size === images.length ? new Set() : new Set(images.map(i => i.key)));

  const handleBulkDel = async () => {
    setBulkDeleting(true);
    setDeleteProgress(0);
    try {
      await removeMany(Array.from(selected), setDeleteProgress);
      setSelected(new Set());
      setConfirmDel(false);
    } finally {
      setBulkDeleting(false);
      setDeleteProgress(0);
    }
  };

  const { visibleItems, hasMore, remaining, sentinelRef } = useVirtualGrid(images);

  if (!user) {
    return <LoginPage onLogin={(d) => { localStorage.setItem('token', d.token); setUser(d); }}/>;
  }

  const inFolder  = currentFolder !== null;
  const selMode   = selected.size > 0;
  const allSel    = images.length > 0 && selected.size === images.length;

  const goBack = () => { setCurrentFolder(null); setSelected(new Set()); };

  return (
    <div style={s.root}>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        {/* Logo */}
        <div style={s.sidebarHead}>
          <div style={s.logo}>
            <div style={s.logoMark}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="#fff" stroke="none"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div>
              <div style={s.logoName}>Profit</div>
              <div style={s.logoSub}>Banco de imágenes</div>
            </div>
          </div>
        </div>

        <div style={s.divider}/>

        {/* Nav */}
        <nav style={s.nav}>
          <p style={s.navSection}>Almacenamiento</p>

          <button
            style={{ ...s.navItem, ...(!inFolder ? s.navItemActive : {}) }}
            onClick={goBack}
          >
            <span style={!inFolder ? s.navIconActive : s.navIcon}><IcoFolder/></span>
            Carpetas
          </button>

          {inFolder && (
            <button style={{ ...s.navItem, ...s.navItemActive }} onClick={() => {}}>
              <span style={s.navIconActive}><IcoImage/></span>
              {currentFolder.name}
            </button>
          )}
        </nav>

        <div style={{ flex: 1 }}/>

        {/* Footer */}
        <div style={s.sidebarFoot}>
          <div style={s.bucketInfo}>
            <div style={s.bucketDot}/>
            <div>
              <div style={s.bucketName}>profit-ecommerce-images</div>
              <div style={s.bucketSub}>nyc3 · DigitalOcean Spaces</div>
            </div>
          </div>
          <div style={s.divider}/>
          <button style={s.btnLogout} onClick={handleLogout}>
            <IcoLogout/> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>

        {/* Topbar */}
        <header style={s.topbar}>
          {/* Breadcrumb */}
          <div style={s.breadcrumb}>
            <span
              style={{ ...s.crumb, ...(inFolder ? s.crumbLink : s.crumbCurrent) }}
              onClick={inFolder ? goBack : undefined}
            >
              Imágenes
            </span>
            {inFolder && (
              <>
                <span style={s.crumbSep}><IcoChevron/></span>
                <span style={s.crumbCurrent}>{currentFolder.name}</span>
              </>
            )}
          </div>

          {/* Actions */}
          <div style={s.topActions}>
            {inFolder && !selMode && (
              <>
                <button style={s.btnGhost} onClick={goBack}>
                  <IcoBack/> Volver
                </button>
                <button style={s.btnPrimary} onClick={() => setShowUpload(true)}>
                  <IcoUpload/> Subir imagen
                </button>
              </>
            )}
          </div>
        </header>

        {/* Bulk toolbar */}
        {selMode && inFolder && (
          <div style={{ ...s.bulkBar, flexDirection: bulkDeleting ? 'column' : 'row', height: bulkDeleting ? 'auto' : 52, padding: bulkDeleting ? '10px 32px' : '0 32px', gap: bulkDeleting ? 8 : 0 }}>
            {bulkDeleting ? (
              /* Progress view */
              <>
                <div style={s.bulkProgressRow}>
                  <span style={s.bulkProgressLabel}>
                    Eliminando imágenes... <strong>{deleteProgress}%</strong>
                  </span>
                  <span style={s.bulkProgressCount}>{Math.round(selected.size * deleteProgress / 100)} / {selected.size}</span>
                </div>
                <div style={s.bulkProgressTrack}>
                  <div style={{ ...s.bulkProgressFill, width: `${deleteProgress}%` }}/>
                </div>
              </>
            ) : (
              /* Normal selection view */
              <>
                <div style={s.bulkLeft}>
                  <input
                    type="checkbox" checked={allSel} onChange={toggleAll}
                    style={{ accentColor:'var(--teal-600)', width:16, height:16, cursor:'pointer' }}
                  />
                  <span style={s.bulkCount}>
                    <strong>{selected.size}</strong> imagen{selected.size !== 1 ? 'es' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={s.bulkRight}>
                  <button style={s.btnGhostSm} onClick={() => { setSelected(new Set()); setConfirmDel(false); }}>
                    Cancelar
                  </button>
                  {!confirmDel ? (
                    <button style={s.btnDangerSm} onClick={() => setConfirmDel(true)}>
                      <IcoTrash/> Eliminar {selected.size}
                    </button>
                  ) : (
                    <>
                      <span style={s.confirmMsg}>¿Eliminar {selected.size} imagen{selected.size !== 1 ? 'es' : ''}?</span>
                      <button style={s.btnDangerSolid} onClick={handleBulkDel} disabled={bulkDeleting}>
                        Confirmar
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content */}
        <div style={s.content}>
          {error && <div style={s.errorBanner}>{error}</div>}

          {/* FOLDERS VIEW */}
          {!inFolder && (
            <>
              <div style={s.pageHead}>
                <div>
                  <h1 style={s.pageTitle}>Carpetas</h1>
                  <p style={s.pageDesc}>Selecciona una carpeta para gestionar sus imágenes</p>
                </div>
              </div>
              <FolderList
                folders={folders} loading={loading}
                onSelect={(f) => { setCurrentFolder(f); setSelected(new Set()); }}
              />
            </>
          )}

          {/* IMAGES VIEW */}
          {inFolder && (
            <>
              <div style={s.pageHead}>
                <div>
                  <h1 style={s.pageTitle}>{currentFolder.name}</h1>
                  <p style={s.pageDesc}>
                    {loading ? 'Cargando...' : `${images.length} imagen${images.length !== 1 ? 'es' : ''}`}
                    {images.length > 0 && !loading && (
                      <button style={s.selAllBtn} onClick={toggleAll}>
                        {allSel ? 'Deseleccionar todas' : 'Seleccionar todas'}
                      </button>
                    )}
                  </p>
                </div>
                {images.length > 0 && !selMode && (
                  <button style={s.btnPrimary} onClick={() => setShowUpload(true)}>
                    <IcoUpload/> Subir imagen
                  </button>
                )}
              </div>

              {loading ? (
                <div style={s.skeletonGrid}>
                  {Array.from({length:12}).map((_,i) => <div key={i} style={s.skeleton}/>)}
                </div>
              ) : images.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--teal-500)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                  <p style={s.emptyTitle}>Esta carpeta está vacía</p>
                  <p style={s.emptyDesc}>Sube la primera imagen a <strong>{currentFolder.name}</strong></p>
                  <button style={s.btnPrimary} onClick={() => setShowUpload(true)}>
                    <IcoUpload/> Subir imagen
                  </button>
                </div>
              ) : (
                <>
                  <div style={s.grid}>
                    {visibleItems.map((img) => (
                      <ImageCard
                        key={img.key} image={img} onDelete={remove}
                        selected={selected.has(img.key)}
                        onToggleSelect={toggleSelect}
                        selectionMode={selMode}
                      />
                    ))}
                  </div>

                  {/* Sentinel — triggers next batch when it enters viewport */}
                  <div ref={sentinelRef} style={{ height: 1 }} />

                  {hasMore && (
                    <div style={s.loadingMore}>
                      <div style={s.loadingDots}>
                        <span style={s.dot}/><span style={s.dot}/><span style={s.dot}/>
                      </div>
                      <span style={s.loadingText}>Cargando {remaining} imágenes más...</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {showUpload && (
        <UploadModal
          defaultPrefix={currentFolder?.prefix || ''}
          onUpload={async (key, file, onProgress) => { await upload(key, file, onProgress); }}
          onBulkUpload={async (files, prefix, onProgress) => { await uploadMany(files, prefix, onProgress); }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}

/* ── Styles ── */
const s = {
  root: { display: 'flex', minHeight: '100vh', background: 'var(--bg)' },

  /* Sidebar */
  sidebar: {
    width: 230, flexShrink: 0, background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh',
    boxShadow: 'var(--shadow-xs)',
  },
  sidebarHead: { padding: '22px 20px 18px' },
  logo: { display: 'flex', alignItems: 'center', gap: 12 },
  logoMark: {
    width: 38, height: 38, borderRadius: 10, background: 'var(--teal-600)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(26,152,136,0.35)',
  },
  logoName: { fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' },
  logoSub: { fontSize: 11, color: 'var(--text-muted)', marginTop: 1 },

  divider: { height: 1, background: 'var(--border-soft)', margin: '0 16px' },

  nav: { padding: '16px 10px 8px' },
  navSection: {
    fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
    letterSpacing: '0.8px', textTransform: 'uppercase',
    padding: '0 10px', marginBottom: 6,
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
    padding: '9px 10px', borderRadius: 'var(--r-sm)', border: 'none',
    background: 'transparent', color: 'var(--text-secondary)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.12s, color 0.12s', fontFamily: 'inherit',
  },
  navItemActive: { background: 'rgba(47,187,168,0.1)', color: 'var(--teal-700)' },
  navIcon: { display:'flex', color:'var(--text-muted)' },
  navIconActive: { display:'flex', color:'var(--teal-600)' },

  sidebarFoot: { padding: '12px 16px 20px' },
  bucketInfo: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 12px' },
  bucketDot: {
    width: 8, height: 8, borderRadius: '50%', background: 'var(--green-600)',
    flexShrink: 0, boxShadow: '0 0 6px rgba(73,175,78,0.5)',
  },
  bucketName: { fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' },
  bucketSub: { fontSize: 10, color: 'var(--text-muted)', marginTop: 1 },
  btnLogout: {
    display: 'flex', alignItems: 'center', gap: 7, marginTop: 12,
    background: 'transparent', border: 'none', color: 'var(--text-muted)',
    fontSize: 12, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
  },

  /* Main */
  main: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },

  topbar: {
    background: 'var(--surface)', borderBottom: '1px solid var(--border)',
    padding: '0 32px', height: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 10, boxShadow: 'var(--shadow-xs)',
  },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 7 },
  crumb: { fontSize: 13 },
  crumbLink: { color: 'var(--teal-600)', cursor: 'pointer', fontWeight: 500 },
  crumbCurrent: { color: 'var(--text-primary)', fontWeight: 600 },
  crumbSep: { color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
  topActions: { display: 'flex', gap: 8, alignItems: 'center' },

  /* Bulk toolbar */
  bulkBar: {
    background: 'rgba(47,187,168,0.07)', borderBottom: '1px solid rgba(47,187,168,0.15)',
    padding: '0 32px', height: 52,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 60, zIndex: 9,
  },
  bulkLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  bulkCount: { fontSize: 13, color: 'var(--text-secondary)' },
  bulkRight: { display: 'flex', alignItems: 'center', gap: 8 },
  confirmMsg: { fontSize: 13, color: 'var(--danger)', fontWeight: 500 },

  /* Content */
  content: { padding: '32px', flex: 1 },

  pageHead: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 28, gap: 16,
  },
  pageTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.4px', lineHeight: 1.2 },
  pageDesc: {
    fontSize: 13, color: 'var(--text-secondary)', marginTop: 5,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  selAllBtn: {
    background: 'none', border: 'none', color: 'var(--teal-600)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 },

  skeletonGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16 },
  skeleton: { height: 240, borderRadius: 'var(--r-lg)', background: 'var(--border-soft)' },

  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '80px 24px', gap: 14,
    background: 'var(--surface)', borderRadius: 'var(--r-xl)',
    border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
  },
  emptyIcon: { marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' },
  emptyDesc: { fontSize: 13, color: 'var(--text-secondary)' },

  errorBanner: {
    marginBottom: 20, padding: '12px 16px',
    background: 'var(--danger-soft)', border: '1px solid var(--danger-border)',
    borderRadius: 'var(--r-sm)', color: 'var(--danger)', fontSize: 13,
  },

  /* Buttons */
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'var(--teal-600)', color: '#fff', border: 'none',
    borderRadius: 'var(--r-full)', padding: '9px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(26,152,136,0.3)',
    transition: 'background 0.15s',
    letterSpacing: '-0.1px',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'var(--surface)', color: 'var(--text-secondary)',
    border: '1.5px solid var(--border)', borderRadius: 'var(--r-full)',
    padding: '8px 18px', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  btnGhostSm: {
    background: 'transparent', color: 'var(--text-secondary)',
    border: '1px solid var(--border)', borderRadius: 'var(--r-full)',
    padding: '6px 14px', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDangerSm: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--danger-soft)', color: 'var(--danger)',
    border: '1px solid var(--danger-border)', borderRadius: 'var(--r-full)',
    padding: '6px 14px', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDangerSolid: {
    background: 'var(--danger)', color: '#fff', border: 'none',
    borderRadius: 'var(--r-full)', padding: '6px 16px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },

  bulkProgressRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  },
  bulkProgressLabel: { fontSize: 13, color: 'var(--danger)', fontWeight: 500 },
  bulkProgressCount: { fontSize: 12, color: 'var(--text-muted)' },
  bulkProgressTrack: {
    width: '100%', height: 6, background: 'rgba(220,38,38,0.15)',
    borderRadius: 'var(--r-full)', overflow: 'hidden',
  },
  bulkProgressFill: {
    height: '100%', background: 'var(--danger)',
    borderRadius: 'var(--r-full)', transition: 'width 0.3s ease',
  },

  loadingMore: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '24px 0', color: 'var(--text-muted)', fontSize: 12,
  },
  loadingDots: { display: 'flex', gap: 4 },
  dot: {
    display: 'inline-block', width: 6, height: 6,
    borderRadius: '50%', background: 'var(--teal-500)', opacity: 0.5,
  },
  loadingText: { fontSize: 12, color: 'var(--text-muted)' },
};
