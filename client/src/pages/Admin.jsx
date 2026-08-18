import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getData } from '../utils/storage';
import {
  fetchPortfolioData,
  addCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  reorderCategoriesApi,
  addItemApi,
  updateItemApi,
  deleteItemApi,
  loginApi,
  reorderCategoryItemsApi,
  updateWebsiteOrderApi,
} from '../utils/api';
import { InstagramIcon, YoutubeIcon, WebsiteIcon } from './Portfolio.jsx';

const TYPE_OPTIONS = [
  { value: 'instagram', label: 'Instagram Reels', icon: <InstagramIcon size={18} />, ph: 'https://www.instagram.com/reel/ABC123/' },
  { value: 'youtube',   label: 'YouTube Videos',  icon: <YoutubeIcon size={20} />,   ph: 'https://www.youtube.com/watch?v=VIDEO_ID' },
  { value: 'website',   label: 'Websites',        icon: <WebsiteIcon size={18} />,   ph: 'https://yourwebsite.com' },
];

const TYPE_COLOR = { instagram: '#e1306c', youtube: '#ff0000', website: '#00b4d8' };
const EMPTY_FORM = { type: 'instagram', url: '', heading: '', description: '', image: '' };

const ORDER_TABS = [
  { key: 'instagram', label: 'Instagram Reels', icon: <InstagramIcon size={16} />, color: '#e1306c' },
  { key: 'youtube',   label: 'YouTube Videos',  icon: <YoutubeIcon size={20} />,   color: '#ff0000' },
  { key: 'website',   label: 'Websites',         icon: <WebsiteIcon size={16} />,   color: '#00b4d8' },
];

export default function Admin() {
  const [data, setData] = useState(getData);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [catInput, setCatInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Order manager state (shown when no category is selected)
  const [orderTab, setOrderTab] = useState('instagram');
  const [orderCatId, setOrderCatId] = useState(null);
  const [websiteOrder, setWebsiteOrder] = useState([]);

  // Drag state for items
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Drag state for categories
  const [dragCatId, setDragCatId] = useState(null);
  const [dragOverCatId, setDragOverCatId] = useState(null);

  // Sidebar resizing state (default 340px)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('admin_sidebar_width');
    return saved ? Math.min(Math.max(parseInt(saved, 10), 280), 650) : 340;
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const startResizingSidebar = (e) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;
    const handleMouseMove = (e) => {
      const newWidth = Math.min(Math.max(e.clientX, 280), 650);
      setSidebarWidth(newWidth);
      localStorage.setItem('admin_sidebar_width', newWidth.toString());
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    localStorage.getItem('admin_token') ? true : false
  );
  const [loginUser, setLoginUser] = useState(() =>
    localStorage.getItem('admin_username') || 'ShankaraSuperAdmin'
  );
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const refresh = (newData) => setData({ ...newData });

  // Initial load from server API
  useEffect(() => {
    const loadData = async () => {
      const res = await fetchPortfolioData();
      setData(res);
      if (res.websiteOrder?.length) setWebsiteOrder(res.websiteOrder);
    };
    loadData();
  }, []);

  // Reset orderCatId when switching order tabs
  useEffect(() => { setOrderCatId(null); }, [orderTab]);

  // Ref for the hidden file input
  const imgInputRef = useRef(null);

  // Convert picked image file → base64 data URL and store in form.image
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, image: ev.target.result, imageName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  /* ── Category actions ── */
  const handleAddCat = async () => {
    const name = catInput.trim();
    if (!name) return;
    const newData = await addCategoryApi(name, catDescInput.trim());
    const lastCat = newData.categories[newData.categories.length - 1];
    refresh(newData);
    if (lastCat) setSelectedCatId(lastCat.id);
    setCatInput('');
    setCatDescInput('');
  };

  const handleStartEditCat = (e, cat) => {
    if (e) e.stopPropagation();
    setEditingCatId(cat.id);
    setEditCatName(cat.name || '');
    setEditCatDesc(cat.description || '');
  };

  const handleSaveEditCat = async () => {
    if (!editCatName.trim() || !editingCatId) return;
    const newData = await updateCategoryApi(editingCatId, {
      name: editCatName.trim(),
      description: editCatDesc.trim()
    });
    refresh(newData);
    setEditingCatId(null);
  };

  const handleCancelEditCat = () => {
    setEditingCatId(null);
  };

  const requestDeleteCat = (e, cat) => {
    e.stopPropagation();
    setConfirmDelete({
      type: 'category',
      id: cat.id,
      name: cat.name,
      count: cat.items.length
    });
  };

  const handleDeleteCat = async (id) => {
    const newData = await deleteCategoryApi(id);
    refresh(newData);
    if (selectedCatId === id) setSelectedCatId(null);
  };

  /* ── Item actions ── */
  const handleAddItem = async () => {
    setFormError('');
    if (!form.url.trim()) { setFormError('URL is required.'); return; }
    if (!selectedCatId) { setFormError('Select a category first.'); return; }

    const itemData = {
      type: form.type,
      url: form.url.trim(),
      heading: form.type === 'website' ? form.heading.trim() : '',
      description: form.type === 'website' ? form.description.trim() : '',
      image: form.type === 'website' ? form.image.trim() : '',
    };

    const newData = await addItemApi(selectedCatId, itemData);
    refresh(newData);
    setForm(f => ({ ...EMPTY_FORM, type: f.type }));
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
  };

  const requestDeleteItem = (catId, item) => {
    setConfirmDelete({
      type: 'item',
      catId,
      itemId: item.id,
      name: item.heading || item.url,
      itemType: item.type
    });
  };

  const handleDeleteItem = async (catId, itemId) => {
    if (editingItemId === itemId) setEditingItemId(null);
    const newData = await deleteItemApi(catId, itemId);
    refresh(newData);
    setWebsiteOrder(prev => prev.filter(id => id !== itemId));
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'category') {
      await handleDeleteCat(confirmDelete.id);
    } else if (confirmDelete.type === 'item') {
      await handleDeleteItem(confirmDelete.catId, confirmDelete.itemId);
    }
    setConfirmDelete(null);
  };

  /* ── Item edit actions ── */
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState({ url: '', heading: '', description: '', image: '', imageName: '' });
  const [editError, setEditError] = useState('');
  const editImgInputRef = useRef(null);

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditError('');
    setEditForm({
      url: item.url || '',
      heading: item.heading || '',
      description: item.description || '',
      image: item.image || '',
      imageName: item.image ? 'Uploaded image' : ''
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditError('');
  };

  const handleSaveEdit = async (itemId, itemType) => {
    setEditError('');
    if (!editForm.url.trim()) { setEditError('URL is required.'); return; }
    const updatedFields = {
      url: editForm.url.trim(),
      heading: itemType === 'website' ? editForm.heading.trim() : '',
      description: itemType === 'website' ? editForm.description.trim() : '',
      image: itemType === 'website' ? editForm.image.trim() : '',
    };
    const newData = await updateItemApi(selectedCatId, itemId, updatedFields);
    refresh(newData);
    setEditingItemId(null);
  };

  const handleEditImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditForm(f => ({ ...f, image: ev.target.result, imageName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  /* ── Drag handlers: categories ── */
  const handleCategoryDragStart = (e, catId) => {
    setDragCatId(catId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e, catId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (catId !== dragOverCatId) setDragOverCatId(catId);
  };

  const handleCategoryDrop = async (e, targetCatId) => {
    e.preventDefault();
    setDragOverCatId(null);
    if (!dragCatId || dragCatId === targetCatId) { setDragCatId(null); return; }

    const oldIdx = data.categories.findIndex(c => c.id === dragCatId);
    const newIdx = data.categories.findIndex(c => c.id === targetCatId);
    if (oldIdx === -1 || newIdx === -1) { setDragCatId(null); return; }

    const reordered = [...data.categories];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    setDragCatId(null);

    // Optimistic update
    setData(prev => ({ ...prev, categories: reordered }));

    setSavingOrder(true);
    try {
      await reorderCategoriesApi(reordered.map(c => c.id));
    } finally {
      setSavingOrder(false);
    }
  };

  /* ── Drag handlers: per-category items (Instagram / YouTube) ── */
  const handleCatDragStart = (e, itemId) => {

    setDragId(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCatDragOver = (e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (itemId !== dragOverId) setDragOverId(itemId);
  };

  const handleCatDrop = async (e, targetId, items, catId, type) => {
    e.preventDefault();
    setDragOverId(null);
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const oldIdx = items.findIndex(i => i.id === dragId);
    const newIdx = items.findIndex(i => i.id === targetId);
    if (oldIdx === -1 || newIdx === -1) { setDragId(null); return; }

    const reordered = [...items];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    setDragId(null);

    // Optimistic update
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(cat => {
        if (cat.id !== catId) return cat;
        let idx = 0;
        return { ...cat, items: cat.items.map(item => item.type === type ? reordered[idx++] : item) };
      })
    }));

    setSavingOrder(true);
    try {
      await reorderCategoryItemsApi(catId, type, reordered.map(i => i.id));
    } finally {
      setSavingOrder(false);
    }
  };

  /* ── Drag handlers: global websites ── */
  const handleWebDragStart = (e, itemId) => {
    setDragId(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWebDragOver = (e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (itemId !== dragOverId) setDragOverId(itemId);
  };

  const handleWebDrop = async (e, targetId, orderedList) => {
    e.preventDefault();
    setDragOverId(null);
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const oldIdx = orderedList.findIndex(i => i.id === dragId);
    const newIdx = orderedList.findIndex(i => i.id === targetId);
    if (oldIdx === -1 || newIdx === -1) { setDragId(null); return; }

    const reordered = [...orderedList];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    setDragId(null);

    const newOrder = reordered.map(i => i.id);
    setWebsiteOrder(newOrder);

    setSavingOrder(true);
    try {
      await updateWebsiteOrderApi(newOrder);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await loginApi(usernameInput, passwordInput);
      if (res.success) {
        localStorage.setItem('admin_token', res.token);
        localStorage.setItem('admin_username', res.user.username);
        setIsAuthenticated(true);
        setLoginUser(res.user.username);
        setPasswordInput('');
      } else {
        setLoginError(res.error || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  /* ── Computed values ── */
  const selectedCat = data.categories.find(c => c.id === selectedCatId);
  const activePlaceholder = TYPE_OPTIONS.find(t => t.value === form.type)?.ph || '';
  // Items filtered by the currently active type tab
  const filteredItems = selectedCat
    ? selectedCat.items.filter(i => i.type === form.type)
    : [];

  // Order manager: categories that have items of the selected order tab type
  const orderCategoriesForTab = useMemo(() =>
    data.categories
      .map(cat => ({ ...cat, items: cat.items.filter(i => i.type === orderTab) }))
      .filter(cat => cat.items.length > 0),
    [data, orderTab]
  );

  // Order manager: items of the selected category + type, in stored order
  const orderCatItems = useMemo(() =>
    orderCatId
      ? (data.categories.find(c => c.id === orderCatId)?.items.filter(i => i.type === orderTab) || [])
      : [],
    [data, orderCatId, orderTab]
  );

  // All websites sorted by global websiteOrder
  const allWebsites = useMemo(() => {
    const all = data.categories.flatMap(cat =>
      cat.items.filter(i => i.type === 'website').map(i => ({ ...i, catId: cat.id }))
    );
    if (!websiteOrder.length) return all;
    return [
      ...websiteOrder.map(id => all.find(w => w.id === id)).filter(Boolean),
      ...all.filter(w => !websiteOrder.includes(w.id))
    ];
  }, [data, websiteOrder]);

  /* ── Render Login Page if not authenticated ── */
  if (!isAuthenticated) {
    const logoSrc = `${import.meta.env.BASE_URL}Admin-page-logo.png`;
    return (
      <div className="adm-login-page">
        <style>{CSS}</style>
        <div className="adm-login-card">
          {/* Logo */}
          <div className="adm-login-logo-wrap">
            <img
              src={logoSrc}
              alt="Shankara Online Solutions"
              className="adm-login-logo"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
            />
            <h2 className="adm-login-logo-fallback" style={{ display: 'none' }}>
              Shankara Online Solutions
            </h2>
          </div>

          {/* Role Pill Bar */}
          <div className="adm-role-bar">
            <button type="button" className="adm-role-btn adm-role-btn--active">Admin</button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="adm-login-form">
            {loginError && <div className="adm-login-err">{loginError}</div>}

            <div className="adm-login-field">
              <label className="adm-login-label">Username</label>
              <input
                type="text"
                className="adm-login-input"
                placeholder="Username"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                autoFocus
              />
            </div>

            <div className="adm-login-field">
              <label className="adm-login-label">Password</label>
              <input
                type="password"
                className="adm-login-input"
                placeholder="••••••••••••"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
              />
            </div>

            <button type="submit" className="adm-login-submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in…' : '➔] Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <aside className="adm-sidebar" style={{ width: `${sidebarWidth}px` }}>
        {/* Top Link & Logout */}
        <div className="adm-sidebar-top">
          <a href="#" className="adm-view-btn">← View Portfolio</a>
          <button className="adm-logout-btn" onClick={handleLogout} title="Log out of Admin">
            Log Out
          </button>
        </div>

        {/* Create Category */}
        <div className="adm-section">
          <p className="adm-section-label">Create Category</p>
          <div className="adm-add-cat-col">
            <input
              className="adm-input"
              placeholder="Category name…"
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
            />
            <textarea
              className="adm-textarea adm-textarea--sm"
              placeholder="Category description (optional)…"
              value={catDescInput}
              onChange={e => setCatDescInput(e.target.value)}
              rows={2}
            />
            <button className="adm-btn-accent" onClick={handleAddCat}>+ Add Category</button>
          </div>
        </div>

        {/* Categories List */}
        <div className="adm-section adm-section--grow">
          <p className="adm-section-label">
            Categories <span className="adm-count-badge">{data.categories.length}</span>
          </p>
          <div className="adm-cats">
            {data.categories.length === 0 && (
              <p className="adm-cats-empty">No categories created yet.</p>
            )}
            {data.categories.map(cat => (
              <div
                key={cat.id}
                className={`adm-cat-row ${selectedCatId === cat.id ? 'adm-cat-row--active' : ''} ${dragOverCatId === cat.id ? 'adm-cat-row--drag-over' : ''} ${dragCatId === cat.id ? 'adm-cat-row--dragging' : ''}`}
                onClick={() => setSelectedCatId(prev => prev === cat.id ? null : cat.id)}
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, cat.id)}
                onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                onDrop={(e) => handleCategoryDrop(e, cat.id)}
                onDragEnd={() => { setDragCatId(null); setDragOverCatId(null); }}
              >
                <div className="adm-drag-handle adm-drag-handle--cat" title="Drag to reorder category">⠿</div>
                <div className="adm-cat-info">
                  <span className="adm-cat-name">{cat.name}</span>
                  <span className="adm-cat-badge">{cat.items.length} items</span>
                </div>
                <div className="adm-cat-btns">
                  <button
                    className="adm-cat-edit"
                    onClick={(e) => handleStartEditCat(e, cat)}
                    title="Edit category"
                  >
                    Edit
                  </button>
                  <button
                    className="adm-cat-del"
                    onClick={(e) => requestDeleteCat(e, cat)}
                    title="Delete category"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right edge drag-to-resize handle */}
        <div
          className={`adm-sidebar-resizer ${isResizingSidebar ? 'adm-sidebar-resizer--active' : ''}`}
          onMouseDown={startResizingSidebar}
          title="Click and drag right to widen sidebar"
        />
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">

        {/* ══ NO CATEGORY SELECTED → Order Manager ══ */}
        {!selectedCat ? (
          <div className="adm-order-wrap">
            <div className="adm-order-header">
              <h2 className="adm-main-title">Display Order</h2>
              <p className="adm-main-sub">
                Select a type, drag ⠿ categories or items to set their display order
                {savingOrder && <span className="adm-saving"> · Saving…</span>}
              </p>
            </div>

            {/* Type tabs */}
            <div className="adm-order-tab-row">
              {ORDER_TABS.map(t => (
                <button
                  key={t.key}
                  className={`adm-order-tab-btn ${orderTab === t.key ? 'adm-order-tab-btn--active' : ''}`}
                  style={orderTab === t.key ? { borderColor: t.color, color: t.color, background: `${t.color}10` } : {}}
                  onClick={() => setOrderTab(t.key)}
                >
                  <span className="adm-order-tab-icon">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Website: flat drag list */}
            {orderTab === 'website' && (
              <div className="adm-order-body">
                <div className="adm-order-sec-header">
                  <div className="adm-order-sec-pill">
                    <WebsiteIcon size={18} />
                    <span>Websites</span>
                  </div>
                  <div className="adm-order-sec-divider" />
                </div>

                {allWebsites.length === 0 ? (
                  <div className="adm-items-empty">
                    <p>No websites added yet.</p>
                    <p>Select a category from the sidebar and add some websites first.</p>
                  </div>
                ) : (
                  <div className="adm-items-list">
                    {allWebsites.map(item => (
                      <div
                        key={item.id}
                        className={`adm-item ${dragOverId === item.id ? 'adm-item--drag-over' : ''} ${dragId === item.id ? 'adm-item--dragging' : ''}`}
                        draggable
                        onDragStart={e => handleWebDragStart(e, item.id)}
                        onDragOver={e => handleWebDragOver(e, item.id)}
                        onDrop={e => handleWebDrop(e, item.id, allWebsites)}
                        onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                      >
                        <div className="adm-item-card-header">
                          <div className="adm-drag-handle" title="Drag to reorder">
                            <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                              <circle cx="3" cy="3" r="1.5" fill="#a0aec0"/>
                              <circle cx="9" cy="3" r="1.5" fill="#a0aec0"/>
                              <circle cx="3" cy="9" r="1.5" fill="#a0aec0"/>
                              <circle cx="9" cy="9" r="1.5" fill="#a0aec0"/>
                              <circle cx="3" cy="15" r="1.5" fill="#a0aec0"/>
                              <circle cx="9" cy="15" r="1.5" fill="#a0aec0"/>
                            </svg>
                          </div>
                          {item.image ? (
                            <img src={item.image} alt={item.heading || 'preview'} className="adm-item-thumb" />
                          ) : (
                            <div className="adm-item-thumb-placeholder">
                              <WebsiteIcon size={24} />
                            </div>
                          )}
                          <div className="adm-item-card-main-info">
                            {item.heading && <h4 className="adm-item-heading">{item.heading}</h4>}
                            <p className="adm-item-url" title={item.url}>{item.url}</p>
                          </div>
                        </div>
                        {item.description && (
                          <div className="adm-item-card-desc">
                            <p className="adm-item-desc">{item.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instagram / YouTube: category picker + drag list */}
            {orderTab !== 'website' && (
              <div className="adm-order-split">
                {/* Left: category list for this type */}
                <div className="adm-order-cats-panel">
                  <p className="adm-order-cats-label">Categories (Drag ⠿ to reorder)</p>
                  {orderCategoriesForTab.length === 0 ? (
                    <p className="adm-order-empty-hint">
                      No {orderTab === 'instagram' ? 'Instagram Reels' : 'YouTube Videos'} added yet.
                    </p>
                  ) : (
                    orderCategoriesForTab.map(cat => (
                      <div
                        key={cat.id}
                        className={`adm-order-cat-chip ${orderCatId === cat.id ? 'adm-order-cat-chip--active' : ''} ${dragOverCatId === cat.id ? 'adm-order-cat-chip--drag-over' : ''} ${dragCatId === cat.id ? 'adm-order-cat-chip--dragging' : ''}`}
                        onClick={() => setOrderCatId(prev => prev === cat.id ? null : cat.id)}
                        draggable
                        onDragStart={(e) => handleCategoryDragStart(e, cat.id)}
                        onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                        onDrop={(e) => handleCategoryDrop(e, cat.id)}
                        onDragEnd={() => { setDragCatId(null); setDragOverCatId(null); }}
                      >
                        <div className="adm-drag-handle adm-drag-handle--cat" title="Drag to reorder category">⠿</div>
                        <span className="adm-order-cat-name">{cat.name}</span>
                        <span className="adm-order-cat-count">{cat.items.length}</span>
                      </div>
                    ))
                  )}
                </div>


                {/* Right: drag list */}
                <div className="adm-order-list-panel">
                  {!orderCatId ? (
                    <div className="adm-order-list-empty">
                      <div className="adm-order-list-empty-icon">←</div>
                      <p>Select a category to reorder its {orderTab === 'instagram' ? 'reels' : 'videos'}</p>
                    </div>
                  ) : orderCatItems.length === 0 ? (
                    <div className="adm-order-list-empty">
                      <p>No {orderTab === 'instagram' ? 'reels' : 'videos'} in this category yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="adm-order-sec-header">
                        <div className="adm-order-sec-pill" style={orderTab === 'instagram' ? { borderColor: '#e1306c', color: '#e1306c', background: '#fdf0f4' } : { borderColor: '#ff0000', color: '#ff0000', background: '#fff0f0' }}>
                          {orderTab === 'instagram' ? <InstagramIcon size={18} /> : <YoutubeIcon size={20} />}
                          <span>{data.categories.find(c => c.id === orderCatId)?.name}</span>
                        </div>
                        <div className="adm-order-sec-divider" />
                      </div>
                      <div className="adm-items-list">
                        {orderCatItems.map(item => (
                          <div
                            key={item.id}
                            className={`adm-item ${dragOverId === item.id ? 'adm-item--drag-over' : ''} ${dragId === item.id ? 'adm-item--dragging' : ''}`}
                            draggable
                            onDragStart={e => handleCatDragStart(e, item.id)}
                            onDragOver={e => handleCatDragOver(e, item.id)}
                            onDrop={e => handleCatDrop(e, item.id, orderCatItems, orderCatId, orderTab)}
                            onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                          >
                            <div className="adm-item-card-header">
                              <div className="adm-drag-handle" title="Drag to reorder">
                                <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                                  <circle cx="3" cy="3" r="1.5" fill="#a0aec0"/>
                                  <circle cx="9" cy="3" r="1.5" fill="#a0aec0"/>
                                  <circle cx="3" cy="9" r="1.5" fill="#a0aec0"/>
                                  <circle cx="9" cy="9" r="1.5" fill="#a0aec0"/>
                                  <circle cx="3" cy="15" r="1.5" fill="#a0aec0"/>
                                  <circle cx="9" cy="15" r="1.5" fill="#a0aec0"/>
                                </svg>
                              </div>
                              {item.image && (
                                <img src={item.image} alt={item.heading || 'preview'} className="adm-item-thumb" />
                              )}
                              <div className="adm-item-card-main-info">
                                <div className="adm-item-type-badge" style={{ color: TYPE_COLOR[item.type] }}>
                                  <span className="adm-item-dot" style={{ background: TYPE_COLOR[item.type] }} />
                                  <span>{TYPE_OPTIONS.find(t => t.value === item.type)?.label || item.type}</span>
                                </div>
                                {item.heading && <h4 className="adm-item-heading">{item.heading}</h4>}
                                <p className="adm-item-url" title={item.url}>{item.url}</p>
                              </div>
                            </div>
                            {item.description && (
                              <div className="adm-item-card-desc">
                                <p className="adm-item-desc">{item.description}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

        ) : (

          /* ══ CATEGORY SELECTED → Add / Edit items (original design) ══ */
          <>
            {/* Category title bar */}
            <div className="adm-main-header">
              <div className="adm-header-actions-row">
                <button
                  className="adm-btn-edit-cat"
                  onClick={(e) => handleStartEditCat(e, selectedCat)}
                  title="Edit Category Name & Description"
                >
                  ✎ Edit Category
                </button>
                <button
                  className="adm-close-btn"
                  onClick={() => setSelectedCatId(null)}
                  title="Deselect category"
                  aria-label="Deselect category"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="adm-header-body">
                <h2 className="adm-main-title">{selectedCat.name}</h2>
                {selectedCat.description && (
                  <p className="adm-main-cat-desc">{selectedCat.description}</p>
                )}
                <p className="adm-main-sub">{selectedCat.items.length} item{selectedCat.items.length !== 1 ? 's' : ''} · Category</p>
              </div>
            </div>

            {/* Add Item Form */}
            <div className="adm-form-card">
              <h3 className="adm-form-title">Add New Item</h3>

              {/* Type selector */}
              <div className="adm-type-row">
                {TYPE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    className={`adm-type-chip ${form.type === t.value ? 'adm-type-chip--active' : ''}`}
                    style={form.type === t.value ? { borderColor: TYPE_COLOR[t.value], color: TYPE_COLOR[t.value] } : {}}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  >
                    <span className="adm-chip-icon">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="adm-fields">
                {/* URL field — all types */}
                <div className="adm-field">
                  <label className="adm-label">URL <span className="adm-req">*</span></label>
                  <input
                    className={`adm-input ${formError && !form.url ? 'adm-input--error' : ''}`}
                    placeholder={activePlaceholder}
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && form.type !== 'website' && handleAddItem()}
                  />
                </div>

                {/* Heading — website only */}
                {form.type === 'website' && (
                  <div className="adm-field">
                    <label className="adm-label">
                      Heading / Title <span className="adm-optional">(optional)</span>
                    </label>
                    <input
                      className="adm-input"
                      placeholder="e.g. Official Website"
                      value={form.heading}
                      onChange={e => setForm(f => ({ ...f, heading: e.target.value }))}
                    />
                  </div>
                )}

                {/* Description — website only */}
                {form.type === 'website' && (
                  <div className="adm-field">
                    <label className="adm-label">
                      Description <span className="adm-optional">(optional)</span>
                    </label>
                    <textarea
                      className="adm-textarea"
                      placeholder="Short description shown below the card…"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                    />
                  </div>
                )}

                {/* Preview Image — website only */}
                {form.type === 'website' && (
                  <div className="adm-field">
                    <label className="adm-label">Preview Image <span className="adm-optional">(optional)</span></label>
                    <input
                      ref={imgInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageFile}
                    />
                    {form.image ? (
                      <div className="adm-img-upload-preview">
                        <img src={form.image} alt="Preview" className="adm-img-preview" />
                        <div className="adm-img-upload-meta">
                          <span className="adm-img-filename">{form.imageName || 'Uploaded image'}</span>
                          <button
                            type="button"
                            className="adm-img-clear-btn"
                            onClick={() => {
                              setForm(f => ({ ...f, image: '', imageName: '' }));
                              if (imgInputRef.current) imgInputRef.current.value = '';
                            }}
                          >✕ Remove</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="adm-img-upload-btn"
                        onClick={() => imgInputRef.current?.click()}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Click to upload image
                        <span className="adm-img-upload-hint">PNG, JPG, WEBP — keep under 2MB</span>
                      </button>
                    )}
                  </div>
                )}

                {formError && <p className="adm-error">{formError}</p>}

                <button
                  className={`adm-submit-btn ${addSuccess ? 'adm-submit-btn--success' : ''}`}
                  onClick={handleAddItem}
                >
                  {addSuccess ? '✓ Added!' : (form.type === 'website' ? '+ Add Website' : '+ Add')}
                </button>
              </div>
            </div>

            {/* Items List — filtered by the active type tab */}
            <div className="adm-items-section">
              <div className="adm-items-header">
                <h3 className="adm-items-title">
                  Items in "{selectedCat.name}"
                </h3>
                {/* Filter tabs — mirrors the type selector above */}
                <div className="adm-items-filter">
                  {TYPE_OPTIONS.map(t => {
                    const count = selectedCat.items.filter(i => i.type === t.value).length;
                    return (
                      <button
                        key={t.value}
                        className={`adm-filter-chip ${form.type === t.value ? 'adm-filter-chip--active' : ''}`}
                        style={form.type === t.value ? { borderColor: TYPE_COLOR[t.value], color: TYPE_COLOR[t.value], background: `${TYPE_COLOR[t.value]}12` } : {}}
                        onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      >
                        <span className="adm-chip-icon">{t.icon}</span>
                        {t.label}
                        <span className="adm-filter-count">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="adm-items-empty">
                  <p>No {TYPE_OPTIONS.find(t => t.value === form.type)?.label} added yet.</p>
                  <p>Use the form above to add one.</p>
                </div>
              ) : (
                <div className="adm-items-list">
                  {[...filteredItems].reverse().map(item => {
                    const isEditing = editingItemId === item.id;
                    if (isEditing) {
                      return (
                        <div key={item.id} className="adm-item adm-item--editing">
                          <div className="adm-edit-form">
                            <div className="adm-edit-header">
                              <span className="adm-item-type-label" style={{ color: TYPE_COLOR[item.type] }}>
                                Editing {TYPE_OPTIONS.find(t => t.value === item.type)?.label || item.type}
                              </span>
                            </div>

                            <div className="adm-field">
                              <label className="adm-label">URL <span className="adm-req">*</span></label>
                              <input
                                className={`adm-input ${editError && !editForm.url ? 'adm-input--error' : ''}`}
                                value={editForm.url}
                                onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
                              />
                            </div>

                            {/* Heading — website only */}
                            {item.type === 'website' && (
                              <div className="adm-field">
                                <label className="adm-label">Heading / Title <span className="adm-optional">(optional)</span></label>
                                <input
                                  className="adm-input"
                                  value={editForm.heading}
                                  onChange={e => setEditForm(f => ({ ...f, heading: e.target.value }))}
                                />
                              </div>
                            )}

                            {/* Description — website only */}
                            {item.type === 'website' && (
                              <div className="adm-field">
                                <label className="adm-label">Description <span className="adm-optional">(optional)</span></label>
                                <textarea
                                  className="adm-textarea"
                                  value={editForm.description}
                                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                  rows={2}
                                />
                              </div>
                            )}

                            {/* Image — website only */}
                            {item.type === 'website' && (
                              <>
                                <div className="adm-field">
                                  <label className="adm-label">Preview Image <span className="adm-optional">(optional)</span></label>
                                  <input
                                    ref={editImgInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleEditImageFile}
                                  />
                                  {editForm.image ? (
                                    <div className="adm-img-upload-preview">
                                      <img src={editForm.image} alt="Preview" className="adm-img-preview" />
                                      <div className="adm-img-upload-meta">
                                        <span className="adm-img-filename">{editForm.imageName || 'Uploaded image'}</span>
                                        <button
                                          type="button"
                                          className="adm-img-clear-btn"
                                          onClick={() => {
                                            setEditForm(f => ({ ...f, image: '', imageName: '' }));
                                            if (editImgInputRef.current) editImgInputRef.current.value = '';
                                          }}
                                        >✕ Remove</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      className="adm-img-upload-btn"
                                      onClick={() => editImgInputRef.current?.click()}
                                    >
                                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                      </svg>
                                      Upload / Change Image
                                    </button>
                                  )}
                                </div>
                              </>
                            )}

                            {editError && <p className="adm-error">{editError}</p>}

                            <div className="adm-edit-actions">
                              <button
                                type="button"
                                className="adm-btn-save"
                                onClick={() => handleSaveEdit(item.id, item.type)}
                              >✓ Save Changes</button>
                              <button
                                type="button"
                                className="adm-btn-cancel"
                                onClick={handleCancelEdit}
                              >Cancel</button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="adm-item">
                        <div className="adm-item-card-header">
                          {item.type === 'website' && item.image ? (
                            <img src={item.image} alt={item.heading || 'preview'} className="adm-item-thumb" />
                          ) : item.type === 'website' ? (
                            <div className="adm-item-thumb-placeholder">
                              <WebsiteIcon size={24} />
                            </div>
                          ) : null}

                          <div className="adm-item-card-main-info">
                            <div className="adm-item-type-badge" style={{ color: TYPE_COLOR[item.type] || '#00b4d8' }}>
                              <span className="adm-item-dot" style={{ background: TYPE_COLOR[item.type] || '#00b4d8' }} />
                              <span>{TYPE_OPTIONS.find(t => t.value === item.type)?.label || item.type}</span>
                            </div>
                            {item.heading && <h4 className="adm-item-heading">{item.heading}</h4>}
                            <p className="adm-item-url" title={item.url}>{item.url}</p>
                          </div>

                          <div className="adm-item-actions">
                            <button
                              className="adm-item-edit-btn"
                              onClick={() => handleStartEdit(item)}
                              title="Edit item"
                            >Edit</button>
                            <button
                              className="adm-item-delete-btn"
                              onClick={() => requestDeleteItem(selectedCat.id, item)}
                              title="Delete item"
                            >Delete</button>
                          </div>
                        </div>

                        {item.description && (
                          <div className="adm-item-card-desc">
                            <p className="adm-item-desc">{item.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ── 2-Step Confirmation Modal ── */}
      {confirmDelete && (
        <div className="adm-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="adm-modal-card" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-icon">⚠️</div>
            <h3 className="adm-modal-title">
              {confirmDelete.type === 'category' ? 'Delete Category?' : 'Delete Item?'}
            </h3>
            <div className="adm-modal-msg">
              {confirmDelete.type === 'category' ? (
                <>
                  Are you sure you want to delete category <strong>"{confirmDelete.name}"</strong>?
                  {confirmDelete.count > 0 && (
                    <span className="adm-modal-warn">
                      <br />This will also delete all {confirmDelete.count} item{confirmDelete.count > 1 ? 's' : ''} inside it.
                    </span>
                  )}
                </>
              ) : (
                <>
                  Are you sure you want to delete this {confirmDelete.itemType || 'item'}?
                  <br /><strong>"{confirmDelete.name}"</strong>
                </>
              )}
            </div>
            <div className="adm-modal-actions">
              <button
                type="button"
                className="adm-modal-btn adm-modal-btn--cancel"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="adm-modal-btn adm-modal-btn--danger"
                onClick={handleConfirmDelete}
                autoFocus
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Edit Modal ── */}
      {editingCatId && (
        <div className="adm-modal-overlay" onClick={handleCancelEditCat}>
          <div className="adm-modal-card adm-modal-card--form" onClick={e => e.stopPropagation()}>
            <h3 className="adm-modal-title">Edit Category</h3>
            <div className="adm-field" style={{ marginTop: 16 }}>
              <label className="adm-label">Category Name <span className="adm-req">*</span></label>
              <input
                className="adm-input"
                placeholder="Category name…"
                value={editCatName}
                onChange={e => setEditCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEditCat()}
                autoFocus
              />
            </div>
            <div className="adm-field" style={{ marginTop: 14 }}>
              <label className="adm-label">Category Description <span className="adm-optional">(optional)</span></label>
              <textarea
                className="adm-textarea"
                placeholder="Description shown below category name on portfolio page…"
                value={editCatDesc}
                onChange={e => setEditCatDesc(e.target.value)}
                rows={4}
              />
            </div>
            <div className="adm-modal-actions" style={{ marginTop: 24 }}>
              <button type="button" className="adm-modal-btn adm-modal-btn--cancel" onClick={handleCancelEditCat}>
                Cancel
              </button>
              <button type="button" className="adm-btn-accent" style={{ flex: 1, padding: '12px 20px', borderRadius: 10 }} onClick={handleSaveEditCat}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Admin Styles ────────────────────────────────────────────────────── */

const CSS = `
  .adm {
    --bg: #f4f5f9;
    --sidebar-bg: #ffffff;
    --surface: #ffffff;
    --surface-2: #f0ecf8;
    --border: rgba(0,0,0,0.08);
    --text: #1a1020;
    --muted: #6b7280;
    --accent: #4d2c7b;
    --danger: #dc2626;
    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', 'Space Grotesk', sans-serif;
    min-height: 100vh;
    display: flex;
  }
  .adm * { box-sizing: border-box; margin: 0; padding: 0; }
  .adm a { text-decoration: none; color: inherit; }

  /* ── Sidebar ── */
  .adm-sidebar {
    position: relative;
    min-height: 100vh;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh; overflow-y: auto;
    box-shadow: 2px 0 12px rgba(0,0,0,0.03);
    flex-shrink: 0;
  }
  .adm-sidebar-resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    height: 100%;
    cursor: col-resize;
    z-index: 50;
    transition: background 0.15s;
  }
  .adm-sidebar-resizer:hover,
  .adm-sidebar-resizer--active {
    background: rgba(77, 44, 123, 0.4);
  }
  .adm-sidebar-top {
    padding: 16px;
    border-bottom: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 10px;
  }
  .adm-view-btn {
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: #4d2c7b;
    padding: 10px 14px; border-radius: 8px;
    background: #f0ecf8; border: 1px solid rgba(77,44,123,0.15);
    text-align: center; transition: all 0.2s; width: 100%;
  }
  .adm-view-btn:hover { background: #4d2c7b; color: #ffffff; }

  /* ── Sidebar sections ── */
  .adm-section { padding: 16px; border-bottom: 1px solid var(--border); }
  .adm-section--grow { flex: 1; display: flex; flex-direction: column; gap: 10px; border-bottom: none; }
  .adm-section-label {
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); font-weight: 700; margin-bottom: 10px;
    display: flex; align-items: center; justify-content: space-between;
  }

  /* ── Inputs ── */
  .adm-input {
    width: 100%;
    background: #ffffff; border: 1px solid rgba(0,0,0,0.12);
    color: var(--text); padding: 9px 12px; border-radius: 9px;
    font-size: 13px; font-family: inherit; outline: none;
    transition: border-color 0.18s;
  }
  .adm-input:focus { border-color: var(--accent); }
  .adm-input::placeholder { color: var(--muted); }
  .adm-input--error { border-color: var(--danger) !important; }

  /* ── Categories ── */
  .adm-cats { display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; }
  .adm-cats-empty { font-size: 12px; color: var(--muted); padding: 8px 0; }
  .adm-cat-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 12px; border-radius: 9px; cursor: pointer;
    border: 1px solid var(--border); transition: all 0.15s; background: #fafafa;
    color: var(--text);
  }
  .adm-cat-row:hover { background: #f0ecf8; border-color: var(--accent); color: var(--text); }
  .adm-cat-row--active { background: #4d2c7b; color: #ffffff !important; border-color: #4d2c7b; }
  .adm-cat-row--active:hover { background: #3c2063; color: #ffffff !important; border-color: #3c2063; }
  .adm-cat-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; }
  .adm-cat-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .adm-cat-badge { font-size: 11px; color: var(--muted); }
  .adm-cat-row--active .adm-cat-badge { color: rgba(255,255,255,0.8); }
  .adm-cat-del {
    font-size: 11px; font-weight: 600; color: #dc2626;
    background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.2);
    padding: 4px 8px; border-radius: 6px; cursor: pointer; font-family: inherit;
    transition: all 0.15s; flex-shrink: 0;
  }
  .adm-cat-row--active .adm-cat-del {
    color: #ffffff; background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.3);
  }
  .adm-cat-del:hover { background: #dc2626; color: #ffffff; }
  .adm-add-cat-row { display: flex; gap: 8px; align-items: center; }
  .adm-btn-accent {
    background: var(--accent); color: #fff;
    padding: 9px 14px; border-radius: 9px; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; font-family: inherit; flex-shrink: 0;
    transition: opacity 0.18s;
  }
  .adm-btn-accent:hover { opacity: 0.88; }
  .adm-count-badge {
    font-size: 11px; color: var(--accent);
    background: #ede9f6; padding: 2px 7px; border-radius: 20px; font-weight: 600;
  }

  /* ── Main ── */
  .adm-main { flex: 1; padding: 40px 48px; overflow-y: auto; }

  /* ── Main header ── */
  .adm-main-header { margin-bottom: 28px; display: flex; flex-direction: column; gap: 8px; }
  .adm-header-actions-row { display: flex; align-items: center; justify-content: flex-end; gap: 10px; width: 100%; }
  .adm-header-body { display: flex; flex-direction: column; gap: 4px; width: 100%; }
  .adm-main-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: #1a1020; margin: 0;
    word-break: break-word;
  }
  .adm-main-sub { font-size: 13px; color: var(--muted); font-weight: 500; }
  .adm-saving { color: var(--accent); font-style: italic; }
  .adm-close-btn {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); background: #ffffff; border: 1px solid var(--border);
    cursor: pointer; transition: all 0.18s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05); flex-shrink: 0;
  }
  .adm-close-btn:hover { color: #dc2626; border-color: rgba(220,38,38,0.3); background: #fef2f2; transform: scale(1.08); }

  /* ── ORDER MANAGER ── */
  .adm-order-wrap { display: flex; flex-direction: column; height: 100%; }
  .adm-order-header { margin-bottom: 24px; }

  .adm-order-tab-row {
    display: flex; gap: 8px; flex-wrap: wrap;
    margin-bottom: 24px; padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .adm-order-tab-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 18px; border-radius: 10px;
    border: 1.5px solid rgba(0,0,0,0.12); background: #fff;
    color: var(--muted); font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .adm-order-tab-btn:hover { border-color: var(--accent); color: var(--accent); }
  .adm-order-tab-btn--active { font-weight: 700; }
  .adm-order-tab-icon { display: flex; align-items: center; }

  .adm-order-body { flex: 1; }

  .adm-order-split {
    display: flex; gap: 24px; flex: 1; min-height: 400px;
  }
  .adm-order-cats-panel {
    width: 220px; flex-shrink: 0;
    display: flex; flex-direction: column; gap: 8px;
  }
  .adm-order-cats-label {
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); font-weight: 700; margin-bottom: 4px;
  }
  .adm-order-empty-hint { font-size: 12px; color: var(--muted); }
  .adm-order-cat-chip {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding: 10px 12px; border-radius: 9px; cursor: pointer;
    border: 1px solid var(--border); background: #fafafa;
    color: var(--text); font-size: 13px; font-family: inherit;
    transition: all 0.15s; text-align: left;
  }
  .adm-order-cat-chip:hover { background: #f0ecf8; border-color: var(--accent); }
  .adm-order-cat-chip--active { background: #4d2c7b; color: #fff; border-color: #4d2c7b; }
  .adm-order-cat-chip--active:hover { background: #3c2063; }
  .adm-order-cat-name { font-weight: 600; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .adm-order-cat-count {
    font-size: 11px; font-weight: 700;
    background: rgba(0,0,0,0.08); border-radius: 20px;
    padding: 2px 8px; flex-shrink: 0;
  }
  .adm-order-cat-chip--active .adm-order-cat-count { background: rgba(255,255,255,0.2); }

  .adm-order-list-panel {
    flex: 1; display: flex; flex-direction: column;
  }
  .adm-order-list-label {
    font-size: 13px; font-weight: 600; color: var(--muted);
    margin-bottom: 12px;
  }
  .adm-order-list-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    flex: 1; gap: 8px; color: var(--muted); text-align: center;
    background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    padding: 40px 20px; font-size: 14px; min-height: 200px;
  }
  .adm-order-list-empty-icon { font-size: 28px; opacity: 0.35; }

  /* ── Add form ── */
  .adm-form-card {
    background: var(--surface); border-radius: 16px; padding: 28px;
    border: 1px solid var(--border); margin-bottom: 36px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }
  .adm-form-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; color: #1a1020; }
  .adm-type-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
  .adm-type-chip {
    display: flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 20px;
    font-size: 13px; font-weight: 500;
    border: 1.5px solid rgba(0,0,0,0.12); color: var(--muted);
    background: #ffffff; cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .adm-type-chip:hover { color: var(--text); border-color: var(--accent); }
  .adm-type-chip--active { font-weight: 600; background: rgba(77,44,123,0.06); }
  .adm-chip-icon { display: flex; align-items: center; }
  .adm-fields { display: flex; flex-direction: column; gap: 14px; }
  .adm-field { display: flex; flex-direction: column; gap: 6px; }
  .adm-label { font-size: 12px; color: var(--muted); font-weight: 500; }
  .adm-req { color: var(--danger); }
  .adm-optional { font-weight: 400; opacity: 0.6; }
  .adm-textarea {
    background: #ffffff; border: 1px solid rgba(0,0,0,0.12);
    color: var(--text); padding: 9px 12px; border-radius: 9px;
    font-size: 13px; font-family: inherit; resize: vertical; outline: none;
    transition: border-color 0.18s; width: 100%;
  }
  .adm-textarea:focus { border-color: var(--accent); }
  .adm-textarea::placeholder { color: var(--muted); }
  .adm-error { font-size: 12px; color: var(--danger); }
  .adm-submit-btn {
    background: var(--accent); color: #fff;
    padding: 13px 20px; border-radius: 10px; font-size: 14px; font-weight: 600;
    border: none; cursor: pointer; font-family: inherit; transition: all 0.2s; width: 100%;
  }
  .adm-submit-btn:hover { opacity: 0.9; }
  .adm-submit-btn--success { background: #16a34a; }

  /* ── Items list ── */
  .adm-items-section { }
  .adm-items-header { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
  .adm-items-title {
    font-size: 15px; font-weight: 700; color: #1a1020;
    display: flex; align-items: center; gap: 8px;
  }
  .adm-items-filter { display: flex; gap: 8px; flex-wrap: wrap; }
  .adm-filter-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 500;
    border: 1.5px solid rgba(0,0,0,0.10); color: var(--muted);
    background: #ffffff; cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .adm-filter-chip:hover { color: var(--text); border-color: rgba(0,0,0,0.25); }
  .adm-filter-chip--active { font-weight: 600; }
  .adm-filter-count {
    font-size: 11px; font-weight: 700;
    background: rgba(0,0,0,0.06); border-radius: 20px;
    padding: 1px 7px; min-width: 20px; text-align: center;
  }
  .adm-filter-chip--active .adm-filter-count { background: rgba(0,0,0,0.10); }
  .adm-items-empty {
    text-align: center; padding: 40px 20px;
    color: var(--muted); font-size: 14px;
    background: var(--surface); border-radius: 14px; border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 6px;
  }
  .adm-order-sec-header {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .adm-order-sec-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 24px;
    border: 1.5px solid #00b4d8;
    background: #eefbfe;
    color: #00b4d8;
    font-size: 13px;
    font-weight: 600;
    width: fit-content;
  }
  .adm-order-sec-divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    width: 100%;
  }

  .adm-items-list { display: flex; flex-direction: column; gap: 14px; }
  .adm-item {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    transition: all 0.18s ease;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
    gap: 12px;
  }
  .adm-item:hover {
    background: #ffffff;
    border-color: rgba(77, 44, 123, 0.3);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  }

  .adm-item-card-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    width: 100%;
  }

  /* ── Drag ── */
  .adm-drag-handle {
    cursor: grab;
    color: #a0aec0;
    padding: 2px;
    user-select: none;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4px;
  }
  .adm-drag-handle:active { cursor: grabbing; }
  .adm-drag-handle--cat {
    margin-top: 0; margin-right: 4px; font-size: 16px; opacity: 0.6; transition: opacity 0.15s;
  }
  .adm-cat-row:hover .adm-drag-handle--cat,
  .adm-order-cat-chip:hover .adm-drag-handle--cat { opacity: 1; }
  .adm-cat-row--active .adm-drag-handle--cat,
  .adm-order-cat-chip--active .adm-drag-handle--cat { color: rgba(255,255,255,0.85); }

  .adm-cat-row--drag-over,
  .adm-order-cat-chip--drag-over {
    border-color: var(--accent) !important;
    background: #f0ecf8 !important;
    box-shadow: 0 4px 12px rgba(77,44,123,0.12) !important;
    transform: scale(1.02);
  }
  .adm-cat-row--dragging,
  .adm-order-cat-chip--dragging { opacity: 0.4; }

  .adm-item--drag-over {
    border-color: var(--accent) !important;
    background: #f0ecf8 !important;
    box-shadow: 0 4px 16px rgba(77,44,123,0.14) !important;
    transform: scale(1.01);
  }
  .adm-item--dragging { opacity: 0.4; }

  .adm-item-thumb {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
  }
  .adm-item-thumb-placeholder {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    background: #f0ecf8;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(77, 44, 123, 0.12);
  }

  .adm-item-card-main-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .adm-item-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
  .adm-item-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .adm-item-heading {
    font-size: 16px;
    font-weight: 700;
    color: #1a1020;
    margin-top: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .adm-item-url {
    font-size: 12px;
    color: #718096;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .adm-item-card-desc {
    width: 100%;
  }
  .adm-item-desc {
    font-size: 13.5px;
    color: #4a5563;
    line-height: 1.5;
    word-break: break-word;
  }

  .adm-item-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    margin-left: auto;
  }
  .adm-item-edit-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    border: 1px solid rgba(77, 44, 123, 0.2);
    background: #f0ecf8;
    color: #4d2c7b;
    transition: all 0.18s ease;
  }
  .adm-item-edit-btn:hover {
    background: #4d2c7b;
    color: #ffffff;
    border-color: #4d2c7b;
  }

  .adm-item-delete-btn {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    border: 1px solid rgba(220, 38, 38, 0.2);
    background: #fef2f2;
    color: #dc2626;
    transition: all 0.18s ease;
  }
  .adm-item-delete-btn:hover {
    background: #dc2626;
    color: #ffffff;
    border-color: #dc2626;
  }

  .adm-item--editing {
    border-color: var(--accent) !important;
    background: #fcfbfe !important;
    box-shadow: 0 4px 16px rgba(77,44,123,0.12);
  }
  .adm-edit-form { width: 100%; display: flex; flex-direction: column; gap: 14px; }
  .adm-edit-header { margin-bottom: 2px; }
  .adm-edit-actions { display: flex; gap: 10px; margin-top: 4px; }
  .adm-btn-save {
    background: #16a34a; color: #fff;
    padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; font-family: inherit; transition: opacity 0.18s;
  }
  .adm-btn-save:hover { opacity: 0.9; }
  .adm-btn-cancel {
    background: #ffffff; color: var(--muted);
    padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    border: 1px solid var(--border); cursor: pointer; font-family: inherit; transition: all 0.15s;
  }
  .adm-btn-cancel:hover { color: var(--text); background: #f3f4f6; }


  /* Image upload */
  .adm-img-upload-btn {
    width: 100%; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 8px; padding: 28px 20px;
    border: 2px dashed rgba(77,44,123,0.25); border-radius: 12px;
    background: #f8f6fc; color: var(--accent);
    font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.18s;
  }
  .adm-img-upload-btn:hover { border-color: var(--accent); background: #ede9f6; }
  .adm-img-upload-hint { font-size: 11px; font-weight: 400; color: var(--muted); }
  .adm-img-upload-preview { display: flex; flex-direction: column; gap: 10px; }
  .adm-img-preview {
    width: 100%; height: 160px; object-fit: cover; display: block;
    border-radius: 10px; border: 1px solid var(--border);
  }
  .adm-img-upload-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .adm-img-filename { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
  .adm-img-clear-btn {
    font-size: 12px; font-weight: 600; color: var(--danger);
    background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.2);
    padding: 4px 10px; border-radius: 6px; cursor: pointer; font-family: inherit;
    flex-shrink: 0; transition: background 0.15s;
  }
  .adm-img-clear-btn:hover { background: rgba(220,38,38,0.16); }

  /* ── Login Page ── */
  .adm-login-page {
    min-height: 100vh; background: #f1edfa;
    display: flex; align-items: center; justify-content: center;
    padding: 24px; font-family: 'Poppins', sans-serif;
  }
  .adm-login-card {
    background: #ffffff; width: 100%; max-width: 440px;
    border-radius: 24px; padding: 38px 40px;
    box-shadow: 0 16px 48px rgba(77, 44, 123, 0.1);
    display: flex; flex-direction: column; align-items: center;
  }
  .adm-login-logo-wrap { margin-bottom: 28px; text-align: center; }
  .adm-login-logo { height: 52px; width: auto; object-fit: contain; }
  .adm-login-logo-fallback { font-size: 22px; font-weight: 700; color: #4d2c7b; margin: 0; }
  .adm-role-bar {
    width: 100%; background: #f1edfa; border-radius: 12px;
    padding: 4px; display: flex; margin-bottom: 28px;
  }
  .adm-role-btn { flex: 1; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; border: none; cursor: default; transition: all 0.2s ease; }
  .adm-role-btn--active { background: #5a2d82; color: #ffffff; box-shadow: 0 2px 8px rgba(90, 45, 130, 0.25); }
  .adm-login-form { width: 100%; display: flex; flex-direction: column; gap: 20px; }
  .adm-login-err { background: #ffebee; color: #d32f2f; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; text-align: center; border: 1px solid rgba(211, 47, 47, 0.2); }
  .adm-login-field { display: flex; flex-direction: column; gap: 8px; }
  .adm-login-label { font-size: 13px; font-weight: 600; color: #4a5568; }
  .adm-login-input {
    width: 100%; height: 48px; background: #eef4ff;
    border: 1.5px solid #dce6f9; border-radius: 10px;
    padding: 0 16px; font-size: 14px; font-family: inherit; color: #1a1020;
    outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }
  .adm-login-input:focus { background: #ffffff; border-color: #5a2d82; box-shadow: 0 0 0 3px rgba(90, 45, 130, 0.12); }
  .adm-login-submit {
    margin-top: 8px; width: 100%; height: 50px;
    background: #5a2d82; color: #ffffff; border: none; border-radius: 12px;
    font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 6px 20px rgba(90, 45, 130, 0.25);
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .adm-login-submit:hover:not(:disabled) { background: #4a236d; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(90, 45, 130, 0.35); }
  .adm-login-submit:disabled { opacity: 0.7; cursor: not-allowed; }
  .adm-logout-btn {
    width: 100%; display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: #dc2626;
    background: rgba(220, 38, 38, 0.08); border: 1px solid rgba(220, 38, 38, 0.2);
    padding: 10px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: all 0.2s ease;
  }
  .adm-logout-btn:hover { background: #dc2626; color: #ffffff; }

  /* ── Confirmation Modal ── */
  .adm-modal-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(15, 10, 25, 0.5);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; animation: admFadeIn 0.15s ease-out;
  }
  @keyframes admFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .adm-modal-card {
    background: #ffffff; border-radius: 20px;
    padding: 28px 32px; max-width: 420px; width: 100%;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    display: flex; flex-direction: column; align-items: center; text-align: center;
    border: 1px solid rgba(0, 0, 0, 0.08);
    animation: admPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes admPopIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .adm-modal-icon {
    font-size: 32px; line-height: 1; margin-bottom: 12px;
    background: #fff5f5; width: 60px; height: 60px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid #fee2e2;
  }
  .adm-modal-title {
    font-size: 18px; font-weight: 700; color: #1a1020; margin-bottom: 8px;
  }
  .adm-modal-msg {
    font-size: 13.5px; color: #555; line-height: 1.5; margin-bottom: 24px;
    word-break: break-word;
  }
  .adm-modal-warn {
    color: #dc2626; font-weight: 500; display: inline-block; margin-top: 4px;
  }
  .adm-modal-actions {
    display: flex; gap: 12px; width: 100%;
  }
  .adm-modal-btn {
    flex: 1; padding: 12px 18px; border-radius: 10px;
    font-size: 14px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: all 0.15s ease; border: none;
  }
  .adm-modal-btn--cancel {
    background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb;
  }
  .adm-modal-btn--cancel:hover {
    background: #e5e7eb; color: #111827;
  }
  .adm-modal-btn--danger {
    background: #dc2626; color: #ffffff;
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
  }
  .adm-modal-btn--danger:hover {
    background: #b91c1c; box-shadow: 0 6px 16px rgba(220, 38, 38, 0.35);
  }

  /* ── Form Modal styling ── */
  .adm-modal-card--form {
    max-width: 540px;
    width: 92%;
    align-items: stretch;
    text-align: left;
    padding: 32px 36px;
  }
  .adm-modal-card--form .adm-modal-title {
    text-align: center;
    font-size: 20px;
    margin-bottom: 4px;
  }
  .adm-modal-card--form .adm-field {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .adm-modal-card--form .adm-label {
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: #1a1020;
  }
  .adm-modal-card--form .adm-input {
    width: 100%;
    height: 44px;
    font-size: 14px;
    padding: 0 14px;
    border-radius: 10px;
  }
  .adm-modal-card--form .adm-textarea {
    width: 100%;
    font-size: 14px;
    padding: 10px 14px;
    min-height: 100px;
    resize: vertical;
    border-radius: 10px;
  }

  /* ── Category Description & Edit styles ── */
  .adm-add-cat-col { display: flex; flex-direction: column; gap: 8px; }
  .adm-textarea--sm { min-height: 52px; font-size: 13px; padding: 8px 10px; resize: vertical; font-family: inherit; }
  .adm-cat-subdesc { font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 120px; display: block; margin-top: 1px; }
  .adm-cat-btns { display: flex; gap: 6px; align-items: center; }
  
  .adm-cat-edit {
    font-size: 11px; font-weight: 600; color: var(--accent);
    background: rgba(77,44,123,0.08); border: 1px solid rgba(77,44,123,0.2);
    padding: 4px 8px; border-radius: 6px; cursor: pointer; font-family: inherit;
    transition: all 0.15s; flex-shrink: 0;
  }
  .adm-cat-edit:hover { background: var(--accent); color: #ffffff; }

  .adm-cat-row--active .adm-cat-subdesc { color: rgba(255,255,255,0.75); }
  .adm-cat-row--active .adm-cat-edit {
    color: #ffffff; background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.35);
  }
  .adm-cat-row--active .adm-cat-edit:hover {
    background: #ffffff; color: var(--accent); border-color: #ffffff;
  }

  .adm-main-cat-desc { font-size: 14px; color: var(--muted); margin: 4px 0 6px; line-height: 1.4; }
  .adm-header-btns { display: flex; align-items: center; gap: 10px; flex-shrink: 0; margin-top: 2px; }
  .adm-btn-edit-cat {
    font-size: 13px; font-weight: 600; color: var(--accent);
    background: #f0ecf8; border: 1px solid rgba(77,44,123,0.2);
    padding: 8px 16px; border-radius: 8px; cursor: pointer;
    transition: all 0.2s; font-family: inherit; white-space: nowrap; flex-shrink: 0;
  }
  .adm-btn-edit-cat:hover { background: var(--accent); color: white; }
  .adm-btn-sec { padding: 8px 16px; border-radius: 8px; background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .adm-btn-sec:hover { background: #e5e7eb; color: #111827; }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .adm { flex-direction: column; }
    .adm-sidebar { width: 100% !important; min-height: auto; height: auto; position: relative; border-right: none; border-bottom: 1px solid var(--border); box-shadow: none; }
    .adm-sidebar-resizer { display: none; }
    .adm-section--grow { flex: initial; }
    .adm-cats { flex: initial; max-height: none; overflow-y: visible; }
    .adm-main { padding: 16px 12px; }
    .adm-order-split { flex-direction: column; }
    .adm-order-cats-panel { width: 100%; }
    .adm-item { padding: 14px; gap: 10px; border-radius: 12px; }
    .adm-item-card-header { gap: 10px; }
    .adm-item-thumb { width: 50px; height: 50px; border-radius: 10px; }
    .adm-item-thumb-placeholder { width: 50px; height: 50px; border-radius: 10px; }
    .adm-item-heading { font-size: 14px; white-space: normal; }
    .adm-item-url { font-size: 11px; white-space: normal; word-break: break-all; }
    .adm-item-actions { flex-direction: row; gap: 6px; }
    .adm-item-edit-btn, .adm-item-delete-btn { padding: 5px 10px; font-size: 11px; }
    .adm-item-desc { font-size: 12.5px; }
  }
`;

