import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getData } from '../utils/storage';
import { fetchPortfolioData } from '../utils/api';

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function getYtId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

function getIgEmbed(url) {
  if (!url) return null;
  const m = url.match(/instagram\.com\/(reel|p|tv)\/([a-zA-Z0-9_-]+)/);
  return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed/` : null;
}

function getHostname(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

/* ─── YouTube Card ────────────────────────────────────────────────────── */

function YoutubeCard({ item }) {
  const videoId = getYtId(item.url);
  if (!videoId) return null;

  const isShort = item.isShort || (item.url && item.url.toLowerCase().includes('/shorts/'));
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&rel=0&modestbranding=1`;

  return (
    <div className={`yt-card ${isShort ? 'yt-card--short' : ''}`}>
      <div className={`yt-frame ${isShort ? 'yt-frame--short' : ''}`}>
        <iframe
          src={src}
          title={item.heading || (isShort ? 'YouTube Short' : 'YouTube video')}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="yt-iframe"
          loading="lazy"
        />
      </div>
      {(item.heading || item.description) && (
        <div className="card-body">
          {item.heading && <p className="card-heading">{item.heading}</p>}
          {item.description && <p className="card-desc">{item.description}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Instagram Card ──────────────────────────────────────────────────── */

function InstagramCard({ item, isStopped, onActivate }) {
  const embed = getIgEmbed(item.url);
  const iframeRef = useRef(null);

  // When the user clicks INSIDE this iframe, the parent window loses focus
  // and document.activeElement becomes this iframe element.
  // We use this to detect interaction without needing a click-blocking overlay.
  useEffect(() => {
    const handleWindowBlur = () => {
      if (document.activeElement === iframeRef.current) {
        onActivate();
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [onActivate]);

  if (!embed) return null;

  // Stopped reels (previously played, now paused) get a blank src to kill audio.
  // Fresh reels keep their normal src so Instagram loads the thumbnail.
  const src = isStopped ? 'about:blank' : `${embed}?hidecaption=true`;

  return (
    <div className="ig-card">
      <div className="ig-clip">
        <iframe
          ref={iframeRef}
          src={src}
          title={item.heading || 'Instagram reel'}
          scrolling="no"
          allowTransparency="true"
          allow="encrypted-media; autoplay"
          className="ig-iframe"
          loading="lazy"
        />
        {/* Only stopped reels show a replay overlay */}
        {isStopped && (
          <div className="ig-replay-overlay" onClick={onActivate}>
            <div className="ig-play-btn">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
            </div>
            <span className="ig-replay-label">Tap to replay</span>
          </div>
        )}
      </div>
      {(item.heading || item.description) && (
        <div className="card-body">
          {item.heading && <p className="card-heading">{item.heading}</p>}
          {item.description && <p className="card-desc">{item.description}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Website Card ────────────────────────────────────────────────────── */

function WebsiteCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noreferrer" className="site-card">
      {/* Image thumbnail */}
      <div className="site-img-wrap">
        {item.image ? (
          <img src={item.image} alt={item.heading || 'Website preview'} className="site-img" />
        ) : (
          <div className="site-img-placeholder">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="rgba(77,44,123,0.3)" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="site-body">
        {item.heading && <p className="site-heading">{item.heading}</p>}
        {item.description && <p className="site-desc">{item.description}</p>}
        <div className="site-visit-row">
          <span className="site-visit-btn">Visit ↗</span>
        </div>
      </div>
    </a>
  );
}

/* ─── SVG Icons ───────────────────────────────────────────────────────── */

export function VideoIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <rect width="24" height="24" rx="6" fill="url(#video-grad-pf)"/>
      <path d="M9.5 8.5L16.5 12L9.5 15.5V8.5Z" fill="white"/>
      <defs>
        <linearGradient id="video-grad-pf" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e1306c"/>
          <stop offset="100%" stopColor="#ff0000"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad-pf)" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="ig-grad-pf" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="15%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="100%" stopColor="#285AEB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function YoutubeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-1.96C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.37z" fill="#FF0000"/>
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#FFFFFF"/>
    </svg>
  );
}

export function WebsiteIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#00b4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function BehanceIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1769ff" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
      <path d="M22 7h-7v-2h7v2zm-11.708 3.791c.729-.464 1.208-1.2 1.208-2.146 0-1.896-1.583-2.645-3.666-2.645h-5.834v12h6.166c2.479 0 4.125-.979 4.125-3.271 0-1.771-1.041-2.771-2.001-3.938zm-5.292-2.791h2.583c.917 0 1.583.25 1.583 1.083 0 .875-.666 1.125-1.583 1.125h-2.583v-2.208zm2.833 7h-2.833v-2.5h2.833c1.041 0 1.75.292 1.75 1.25 0 .979-.709 1.25-1.75 1.25zm12.333-3.417h-5.166c.125 1.208 1.041 1.75 2.166 1.75.917 0 1.625-.333 1.958-.833h2.333c-.583 1.833-2.25 2.667-4.291 2.667-2.917 0-4.708-1.958-4.708-4.667 0-2.625 1.791-4.625 4.625-4.625 2.917 0 4.417 2.083 4.417 4.542 0 .417-.042.833-.083 1.166zm-4.791-1.833h2.875c-.166-.875-.791-1.375-1.458-1.375-.708 0-1.292.5-1.417 1.375z"/>
    </svg>
  );
}

/* ─── Tab config ──────────────────────────────────────────────────────── */

const TABS = [
  { key: 'instagram', label: 'Instagram Reels', icon: <InstagramIcon size={18} />, accent: '#e1306c', type: 'instagram' },
  { key: 'youtube',   label: 'YouTube Videos',  icon: <YoutubeIcon size={20} />,   accent: '#ff0000', type: 'youtube' },
  { key: 'websites',  label: 'Websites',        icon: <WebsiteIcon size={18} />,  accent: '#00b4d8', type: 'website' },
  { key: 'behance',   label: 'Behance',         icon: <BehanceIcon size={18} />,  accent: '#1769ff', isLink: true, url: 'https://www.behance.net/shankaraonline' },
];

/* ─── Portfolio Page ──────────────────────────────────────────────────── */

export default function Portfolio() {
  const [data, setData] = useState(getData);

  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'websites' || hash === 'website') return 'websites';
    if (hash === 'youtube') return 'youtube';
    return 'instagram';
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [selectedCatId, setSelectedCatId] = useState('all');
  const [activeReelId, setActiveReelId] = useState(null);
  const [stoppedIds, setStoppedIds] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use a ref so activateReel always reads the latest activeReelId without stale closure
  const activeReelIdRef = useRef(null);
  useEffect(() => { activeReelIdRef.current = activeReelId; }, [activeReelId]);

  // activateReel: stop the currently-playing reel (reset src) and start the new one.
  // Also removes the newly-active reel from stoppedIds so its src is restored.
  const activateReel = useCallback((id) => {
    const prev = activeReelIdRef.current;
    setStoppedIds(existing => {
      // Remove the newly-active reel from stopped (so its src gets restored)
      const cleaned = existing.filter(x => x !== id);
      // Add the previously-active reel to stopped (so its audio is killed)
      if (prev && prev !== id && !cleaned.includes(prev)) {
        return [...cleaned, prev];
      }
      return cleaned;
    });
    setActiveReelId(id);
  }, []);

  const resetPlayback = useCallback(() => {
    setActiveReelId(null);
    setStoppedIds([]);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const res = await fetchPortfolioData();
      setData(res);
    };
    loadData();

    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'websites' || hash === 'website') {
        setActiveTab('websites');
      } else if (hash === 'youtube') {
        setActiveTab('youtube');
      } else if (hash === 'instagram') {
        setActiveTab('instagram');
      } else if (hash === 'videos') {
        setActiveTab(prev => (prev === 'youtube' || prev === 'instagram' ? prev : 'instagram'));
      }
    };
    const onFocus = () => loadData();

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleTabClick = (key) => {
    resetPlayback();
    setActiveTab(key);
    setSelectedCatId(null);
    if (key === 'instagram' || key === 'youtube') {
      window.location.hash = '#videos';
    } else {
      window.location.hash = '#websites';
    }
  };

  // Fixed logo
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

  const tab = TABS.find(t => t.key === activeTab) || TABS[0];
  const accent = tab.accent;

  const relevantCats = data.categories
    .map(cat => ({ ...cat, items: cat.items.filter(i => i.type === tab.type) }))
    .filter(cat => cat.items.length > 0);

  // Active category defaults to the first category if available
  const activeCatId = selectedCatId && relevantCats.some(c => c.id === selectedCatId)
    ? selectedCatId
    : (relevantCats[0]?.id || null);

  const displayedCats = activeCatId
    ? relevantCats.filter(cat => cat.id === activeCatId)
    : relevantCats;

  const websiteItems = data.categories
    .flatMap(cat => cat.items.filter(i => i.type === 'website'));

  const videoItems = displayedCats.flatMap(cat => cat.items);


  return (
    <div className="pf">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <header className="pf-header">
        <div className="pf-header-inner">
          {/* Logo (clickable link to website) */}
          <a
            href="https://shankaraonline.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="pf-logo-link"
            title="Visit Shankara Online Website"
          >
            <div className="pf-logo-wrap">
              <img
                src={logoSrc}
                alt="Logo"
                className="pf-logo-img"
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div className="pf-logo-ph" style={{ display: 'none' }}>S</div>
            </div>
          </a>

          {/* Title */}
          <h1 className="pf-title">Portfolio</h1>

          {/* Hamburger Menu Toggle (Mobile Only) */}
          <button
            className="pf-menu-toggle"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            title="Menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="pf-mobile-dropdown">
            {TABS.map(t => (
              t.isLink ? (
                <a
                  key={t.key}
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pf-mobile-tab"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: t.accent }}
                >
                  <span className="pf-tab-icon">{t.icon}</span>
                  <span className="pf-tab-label">{t.label}</span>
                  <span className="pf-link-arrow">↗</span>
                </a>
              ) : (
                <button
                  key={t.key}
                  className={`pf-mobile-tab ${activeTab === t.key ? 'pf-mobile-tab--active' : ''}`}
                  onClick={() => {
                    handleTabClick(t.key);
                    setMobileMenuOpen(false);
                  }}
                  style={activeTab === t.key ? { color: t.accent, borderColor: t.accent } : {}}
                >
                  <span className="pf-tab-icon">{t.icon}</span>
                  <span className="pf-tab-label">{t.label}</span>
                  {activeTab === t.key && <span className="pf-tab-check">✓</span>}
                </button>
              )
            ))}
          </div>
        )}
      </header>

      {/* ── Tabs ── */}
      <nav className="pf-tabs">
        <div className="pf-tabs-inner">
          {TABS.map(t => (
            t.isLink ? (
              <a
                key={t.key}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pf-tab"
                style={{ color: t.accent, '--tab-accent': t.accent, textDecoration: 'none' }}
                title={`Visit ${t.label} Profile`}
              >
                <span className="pf-tab-icon">{t.icon}</span>
                {t.label} ↗
              </a>
            ) : (
              <button
                key={t.key}
                className={`pf-tab ${activeTab === t.key ? 'pf-tab--active' : ''}`}
                style={activeTab === t.key ? { color: t.accent, '--tab-accent': t.accent } : {}}
                onClick={() => handleTabClick(t.key)}
              >
                <span className="pf-tab-icon">{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span className="pf-tab-indicator" style={{ background: t.accent }} />
                )}
              </button>
            )
          ))}
        </div>
      </nav>

      {/* ── Category Mosaic Sub-nav (for Instagram Reels & YouTube Videos) ── */}
      {activeTab !== 'websites' && relevantCats.length > 0 && (
        <div className="pf-mosaic-wrap">
          <div className="pf-mosaic-inner">
            {relevantCats.map(cat => {
              const isActive = activeCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  className={`pf-mosaic-chip ${isActive ? 'pf-mosaic-chip--active' : ''}`}
                  onClick={() => { resetPlayback(); setSelectedCatId(cat.id); }}
                >
                  <span className="pf-chip-label">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="pf-main">
        {activeTab === 'websites' ? (
          websiteItems.length === 0 ? (
            <div className="pf-empty">
              <div className="pf-empty-icon">{tab.icon}</div>
              <p className="pf-empty-title">No {tab.label} content yet</p>
              <p className="pf-empty-sub">
                Go to <a href="#admin" className="pf-empty-link">Admin</a> and add some {tab.label.toLowerCase()} links.
              </p>
            </div>
          ) : (
            <section className="pf-cat">
              <div className="pf-grid pf-grid--websites">
                {websiteItems.map(item => (
                  <WebsiteCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
        ) : (
          videoItems.length === 0 ? (
            <div className="pf-empty">
              <div className="pf-empty-icon">{tab.icon}</div>
              <p className="pf-empty-title">No {tab.label} content yet</p>
              <p className="pf-empty-sub">
                Go to <a href="#admin" className="pf-empty-link">Admin</a> and add some {tab.label.toLowerCase()} links.
              </p>
            </div>
          ) : (
            <section className="pf-cat">
              <div className={`pf-grid pf-grid--${activeTab}`}>
                {activeTab === 'instagram' && videoItems.map(item => (
                  <InstagramCard
                    key={item.id}
                    item={item}
                    isActive={activeReelId === item.id}
                    isStopped={stoppedIds.includes(item.id)}
                    onActivate={() => activateReel(item.id)}
                  />
                ))}
                {activeTab === 'youtube' && videoItems.map(item => (
                  <YoutubeCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
        )}
      </main>

      <footer className="pf-footer">
        <span>
          © {new Date().getFullYear()} {data.portfolioTitle || 'Portfolio'} · Built with <span className="pf-heart">♥</span> by{' '}
          <a
            href="https://shankaraonline.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="pf-footer-link"
          >
            ShankaraOnline
          </a>
        </span>
      </footer>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────── */

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

  .pf {
    --bg: #f4f5f9;
    --surface: #ffffff;
    --surface-2: #edeef5;
    --border: rgba(0,0,0,0.08);
    --text: #1a1020;
    --muted: #6b7280;
    --accent: #4d2c7b;
    background: var(--bg);
    color: var(--text);
    font-family: 'Poppins', sans-serif;
    min-height: 100vh;
  }
  .pf * { box-sizing: border-box; font-family: 'Poppins', sans-serif; }
  .pf a { text-decoration: none; color: inherit; }

  /* ── Header ── */
  .pf-header {
    position: sticky; top: 0; z-index: 100;
    background: #4d2c7b;
    box-shadow: 0 2px 16px rgba(77,44,123,0.25);
  }
  .pf-header-inner {
    max-width: 1440px; margin: 0 auto;
    padding: 12px 40px;
    display: flex; align-items: center;
    position: relative;
  }
  .pf-logo-link {
    text-decoration: none;
    display: flex;
    align-items: center;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .pf-logo-link:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }
  .pf-menu-toggle { display: none; }
  .pf-logo-wrap { flex: 1; display: flex; align-items: center; }
  .pf-logo-img { height: 48px; width: auto; object-fit: contain; border-radius: 0; }
  .pf-logo-ph {
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 22px; color: #fff;
    letter-spacing: -0.02em; border: 2px solid rgba(255,255,255,0.3);
  }
  .pf-title {
    position: absolute; left: 50%; transform: translateX(-50%);
    font-family: 'Poppins', sans-serif;
    font-size: 22px; font-weight: 700; letter-spacing: -0.02em;
    white-space: nowrap; color: #ffffff;
  }
  .pf-admin-link {
    margin-left: auto;
    font-size: 12px; color: rgba(255,255,255,0.75);
    padding: 6px 14px;
    border: 1px solid rgba(255,255,255,0.25); border-radius: 20px;
    transition: all 0.2s; letter-spacing: 0.04em;
  }
  .pf-admin-link:hover { color: #fff; border-color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.1); }

  /* ── Tabs ── */
  .pf-tabs {
    background: #ffffff;
    border-bottom: 1px solid var(--border);
    position: sticky; top: 73px; z-index: 90;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .pf-tabs-inner {
    max-width: 1440px; margin: 0 auto; padding: 0 40px;
    display: flex; justify-content: center; gap: 4px;
  }
  .pf-tab {
    position: relative; display: flex; align-items: center; gap: 7px;
    padding: 16px 28px;
    font-size: 14px; font-weight: 500; color: var(--muted);
    background: none; border: none; cursor: pointer; font-family: inherit;
    transition: color 0.2s;
  }
  .pf-tab:hover { color: #4d2c7b; }
  .pf-tab--active { font-weight: 600; color: #4d2c7b !important; }
  .pf-tab-icon { font-size: 16px; }
  .pf-tab-indicator {
    position: absolute; bottom: -1px; left: 0; right: 0;
    height: 3px; border-radius: 3px 3px 0 0;
  }

  /* ── Mosaic Category Subnav ── */
  .pf-mosaic-wrap {
    background: transparent;
    padding: 14px 40px 0;
  }
  .pf-mosaic-inner {
    max-width: 1440px; margin: 0 auto;
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px;
  }
  .pf-mosaic-chip {
    display: inline-flex; align-items: center;
    padding: 9px 20px; border-radius: 999px;
    font-size: 13px; font-weight: 600; font-family: 'Poppins', sans-serif; letter-spacing: 0.01em;
    color: #4d2c7b; background: #ffffff;
    border: 1.5px solid #c4aee8; cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    user-select: none;
  }
  .pf-chip-label { flex: 1; white-space: nowrap; }
  .pf-mosaic-chip:hover {
    background: #ede9f6;
    color: #3b1f5e;
    border-color: #9b72d0;
    box-shadow: 0 4px 14px rgba(77,44,123,0.15);
  }
  .pf-mosaic-chip--active {
    background: #4d2c7b;
    color: #ffffff;
    border-color: #4d2c7b;
    box-shadow: 0 4px 16px rgba(77,44,123,0.28);
  }
  .pf-mosaic-chip--active:hover {
    background: #4d2c7b;
    color: #ffffff;
    border-color: #4d2c7b;
    box-shadow: 0 4px 16px rgba(77,44,123,0.28);
  }

  /* ── Main ── */
  .pf-main { max-width: 1440px; margin: 0 auto; padding: 20px 40px 40px; }

  /* ── Category ── */
  .pf-cat { margin-bottom: 72px; }
  .pf-cat-header {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 28px;
  }
  .pf-cat-pill { width: 5px; height: 32px; border-radius: 3px; flex-shrink: 0; background: #4d2c7b !important; }
  .pf-cat-name {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 26px; font-weight: 700; letter-spacing: -0.02em; color: #1a1020;
  }
  .pf-cat-count {
    font-size: 12px; color: var(--muted);
    background: #ede9f6; color: #4d2c7b; font-weight: 600;
    padding: 4px 10px; border-radius: 20px;
  }

  /* ── Grids ── */
  .pf-grid--videos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    align-items: start;
  }
  .pf-grid--instagram {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    align-items: start;
  }
  .pf-grid--youtube {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
    align-items: start;
  }
  .pf-grid--websites {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }

  /* ── YouTube Card ── */
  .yt-card {
    background: var(--surface); border-radius: 16px;
    overflow: hidden; border: 1px solid var(--border);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    display: flex; flex-direction: column;
    width: 100%;
  }
  .yt-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(255,0,0,0.15);
    border-color: #ff0000;
  }
  .yt-card--short {
    /* Shorts show in same grid */
  }
  /* Standard video: 16:9 ratio */
  .yt-frame {
    position: relative; width: 100%;
    padding-top: 56.25%;
    background: #000;
    overflow: hidden;
  }
  /* Shorts: native 9:16 vertical ratio framing */
  .yt-frame--short {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 16;
    background: #000;
    overflow: hidden;
  }
  .yt-iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .mute-btn {
    position: absolute; bottom: 10px; right: 10px; z-index: 5;
    width: 36px; height: 36px; border-radius: 50%;
    background: rgba(0,0,0,0.72); color: white; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; border: none;
    backdrop-filter: blur(6px);
    transition: transform 0.15s, background 0.15s;
  }
  .mute-btn:hover { transform: scale(1.12); background: rgba(77,44,123,0.92); }

  /* ── Instagram Card ── */
  .ig-card {
    background: var(--surface); border-radius: 16px;
    overflow: hidden; border: 1px solid var(--border);
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .ig-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(77,44,123,0.15); }

  /* Instagram Clip: native 9:16 aspect ratio framing */
  .ig-clip {
    position: relative;
    width: 100%;
    aspect-ratio: 9 / 16;
    overflow: hidden;
    background: #000;
    border-radius: 14px;
  }
  .ig-iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
    display: block;
  }
  /* Play / Replay overlay — only shown on stopped (blank) reels */
  .ig-replay-overlay {
    position: absolute;
    inset: 0;
    z-index: 3;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(0,0,0,0.72);
    transition: background 0.2s;
  }
  .ig-replay-overlay:hover { background: rgba(0,0,0,0.82); }
  .ig-play-btn {
    width: 62px; height: 62px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.18s, background 0.18s;
  }
  .ig-replay-overlay:hover .ig-play-btn {
    transform: scale(1.1);
    background: rgba(255,255,255,0.25);
  }
  .ig-replay-label {
    color: rgba(255,255,255,0.85);
    font-size: 12px; font-weight: 500;
    letter-spacing: 0.3px;
  }

  /* ── Card body (shared) ── */
  .card-body { padding: 14px 16px; }
  .card-heading {
    font-size: 14px; font-weight: 600; margin: 0 0 4px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .card-desc {
    font-size: 12px; color: var(--muted); margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  /* ── Website Card ── */
  .site-card {
    display: flex; flex-direction: column;
    background: var(--surface); border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    overflow: hidden;
    cursor: pointer; transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    text-decoration: none; color: inherit;
    height: 100%;
  }
  .site-card:hover {
    border-color: #4d2c7b;
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(77,44,123,0.18);
  }
  /* Image box */
  .site-img-wrap {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #f0ecf8;
    flex-shrink: 0;
  }
  .site-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform 0.3s ease;
  }
  .site-card:hover .site-img { transform: scale(1.05); }
  .site-img-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: #f0ecf8;
  }
  /* Body */
  .site-body {
    display: flex; flex-direction: column; gap: 8px;
    padding: 18px 20px 20px;
    flex: 1;
  }
  .site-heading {
    font-size: 16px; font-weight: 700; color: #1a1020;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.35; margin: 0;
  }
  .site-desc {
    font-size: 13px; color: var(--muted);
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    line-height: 1.5; flex: 1; margin: 0;
  }
  .site-visit-row {
    margin-top: auto; padding-top: 12px;
    display: flex; justify-content: flex-end;
  }
  .site-visit-btn {
    font-size: 13px; font-weight: 700; color: #4d2c7b;
    padding: 6px 16px; border-radius: 20px;
    background: #ede9f6; border: 1px solid rgba(77,44,123,0.15);
    transition: all 0.18s ease;
  }
  .site-card:hover .site-visit-btn {
    background: #4d2c7b; color: #fff;
  }

  /* ── Empty State ── */
  .pf-empty {
    text-align: center; padding: 120px 20px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .pf-empty-icon { font-size: 48px; }
  .pf-empty-title { font-size: 22px; font-weight: 700; color: #1a1020; }
  .pf-empty-sub { font-size: 14px; color: var(--muted); }
  .pf-empty-link { color: #4d2c7b; font-weight: 600; }
  .pf-empty-link:hover { text-decoration: underline; }

  /* ── Footer ── */
  .pf-footer {
    text-align: center; padding: 32px 24px;
    color: var(--muted); font-size: 12px;
    border-top: 1px solid var(--border);
    background: #fff;
    letter-spacing: 0.06em;
  }
  .pf-heart {
    color: #e53935;
    display: inline-block;
    margin: 0 2px;
  }
  .pf-footer-link {
    color: #4d2c7b;
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
  }
  .pf-footer-link:hover {
    text-decoration: underline;
    color: #3b1f5e;
  }

  /* ── Responsive ── */
  @media (max-width: 1400px) {
    .pf-grid--instagram { grid-template-columns: repeat(4, 1fr); }
    .pf-grid--youtube { grid-template-columns: repeat(4, 1fr); }
    .pf-grid--websites { grid-template-columns: repeat(4, 1fr); }
  }
  @media (max-width: 1100px) {
    .pf-grid--instagram { grid-template-columns: repeat(3, 1fr); }
    .pf-grid--youtube { grid-template-columns: repeat(3, 1fr); }
    .pf-grid--websites { grid-template-columns: repeat(3, 1fr); }
    .pf-main { padding: 20px 28px 32px; }
    .pf-header-inner { padding: 14px 28px; }
    .pf-tabs-inner { padding: 0 28px; }
  }
  @media (max-width: 768px) {
    .pf-title { font-size: 17px; }
    .pf-tabs { display: none; }
    .pf-menu-toggle { display: flex; margin-left: auto; background: none; border: none; cursor: pointer; padding: 6px; }
    .pf-mobile-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 120;
      background: #ffffff;
      padding: 14px 18px 8px;
      border-bottom: 1px solid var(--border);
      box-shadow: 0 12px 32px rgba(0,0,0,0.18);
      display: flex; flex-direction: column;
    }
    .pf-mobile-tab {
      width: 100%; display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border-radius: 12px;
      font-size: 15px; font-weight: 600; text-align: left;
      background: #f8f9fc; border: 1.5px solid transparent;
      margin-bottom: 8px; font-family: inherit;
      cursor: pointer; transition: all 0.2s;
    }
    .pf-mobile-tab--active {
      background: #ede9f6; font-weight: 700;
    }
    .pf-tab-label { flex: 1; font-size: 14px; }
    .pf-tab-check { font-weight: 800; font-size: 15px; }
    .pf-link-arrow { opacity: 0.7; font-size: 15px; }
    .pf-grid--websites { grid-template-columns: repeat(2, 1fr); }
    .pf-grid--instagram { grid-template-columns: repeat(2, 1fr); }
    .pf-grid--youtube { grid-template-columns: repeat(2, 1fr); }
    .pf-grid--videos { grid-template-columns: 1fr; }
    .pf-cat-name { font-size: 21px; }
    .pf-main { padding: 16px 18px 24px; }
    .pf-header-inner { padding: 12px 18px; }
  }
  @media (max-width: 480px) {
    .pf-grid--websites { grid-template-columns: 1fr; }
    .pf-grid--instagram { grid-template-columns: 1fr; }
    .pf-grid--youtube { grid-template-columns: 1fr; }
    .pf-title { display: none; }
  }

  /* ── Motion ── */
  @media (prefers-reduced-motion: reduce) {
    .yt-card, .ig-card, .site-card { transition: none; }
    .pf-tab-indicator { transition: none; }
  }
`;
