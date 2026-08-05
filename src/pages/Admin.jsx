import React, { useState, useEffect, useRef } from 'react';
import { getData } from '../utils/storage';
import {
  fetchPortfolioData,
  addCategoryApi,
  deleteCategoryApi,
  addItemApi,
  updateItemApi,
  deleteItemApi
} from '../utils/api';
import { InstagramIcon, YoutubeIcon, WebsiteIcon } from './Portfolio.jsx';

const TYPE_OPTIONS = [
  { value: 'instagram', label: 'Instagram Reels', icon: <InstagramIcon size={18} />, ph: 'https://www.instagram.com/reel/ABC123/' },
  { value: 'youtube',   label: 'YouTube Videos',  icon: <YoutubeIcon size={20} />,   ph: 'https://www.youtube.com/watch?v=VIDEO_ID' },
  { value: 'website',   label: 'Websites',        icon: <WebsiteIcon size={18} />,  ph: 'https://yourwebsite.com' },
];

const TYPE_COLOR = { instagram: '#e1306c', youtube: '#ff0000', website: '#00b4d8' };

const EMPTY_FORM = { type: 'instagram', url: '', heading: '', description: '', image: '' };

export default function Admin() {
  const [data, setData] = useState(getData);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [catInput, setCatInput] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [addSuccess, setAddSuccess] = useState(false);

  const refresh = (newData) => setData({ ...newData });

  // Initial load from server API
  useEffect(() => {
    const loadData = async () => {
      const res = await fetchPortfolioData();
      setData(res);
    };
    loadData();
  }, []);

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
    const newData = await addCategoryApi(name);
    const lastCat = newData.categories[newData.categories.length - 1];
    refresh(newData);
    if (lastCat) setSelectedCatId(lastCat.id);
    setCatInput('');
  };

  const handleDeleteCat = async (e, id) => {
    e.stopPropagation();
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

  const handleDeleteItem = async (catId, itemId) => {
    if (editingItemId === itemId) setEditingItemId(null);
    const newData = await deleteItemApi(catId, itemId);
    refresh(newData);
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
    if (!editForm.url.trim()) {
      setEditError('URL is required.');
      return;
    }
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

  const selectedCat = data.categories.find(c => c.id === selectedCatId);
  const activePlaceholder = TYPE_OPTIONS.find(t => t.value === form.type)?.ph || '';
  // Items filtered by the currently active type tab
  const filteredItems = selectedCat
    ? selectedCat.items.filter(i => i.type === form.type)
    : [];

  return (
    <div className="adm">
      <style>{CSS}</style>

      {/* ── Sidebar ── */}
      <aside className="adm-sidebar">
        {/* Top Link */}
        <div className="adm-sidebar-top">
          <a href="#" className="adm-view-btn">← View Portfolio</a>
        </div>

        {/* Create Category */}
        <div className="adm-section">
          <p className="adm-section-label">Create Category</p>
          <div className="adm-add-cat-row">
            <input
              className="adm-input"
              placeholder="Company name…"
              value={catInput}
              onChange={e => setCatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCat()}
            />
            <button className="adm-btn-accent" onClick={handleAddCat}>+ Add</button>
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
                className={`adm-cat-row ${selectedCatId === cat.id ? 'adm-cat-row--active' : ''}`}
                onClick={() => setSelectedCatId(prev => prev === cat.id ? null : cat.id)}
              >
                <div className="adm-cat-info">
                  <span className="adm-cat-name">{cat.name}</span>
                  <span className="adm-cat-badge">{cat.items.length} items</span>
                </div>
                <button
                  className="adm-cat-del"
                  onClick={(e) => handleDeleteCat(e, cat.id)}
                  title="Delete category"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="adm-main">
        {!selectedCat ? (
          <div className="adm-no-select">
            <div className="adm-no-select-icon">←</div>
            <p className="adm-no-select-text">Select a category to manage its content</p>
            <p className="adm-no-select-sub">Or create a new category in the sidebar</p>
          </div>
        ) : (
          <>
            {/* Category title bar */}
            <div className="adm-main-header">
              <div>
                <h2 className="adm-main-title">{selectedCat.name}</h2>
                <p className="adm-main-sub">{selectedCat.items.length} item{selectedCat.items.length !== 1 ? 's' : ''} · Category</p>
              </div>
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
                {form.type !== 'website' ? (
                  <div className="adm-field">
                    <label className="adm-label">URL <span className="adm-req">*</span></label>
                    <div className="adm-url-inline-row">
                      <input
                        className={`adm-input ${formError && !form.url ? 'adm-input--error' : ''}`}
                        placeholder={activePlaceholder}
                        value={form.url}
                        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                      />
                      <button
                        className={`adm-inline-add-btn ${addSuccess ? 'adm-submit-btn--success' : ''}`}
                        onClick={handleAddItem}
                      >
                        {addSuccess ? '✓ Added!' : '+ Add'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="adm-field">
                      <label className="adm-label">URL <span className="adm-req">*</span></label>
                      <input
                        className={`adm-input ${formError && !form.url ? 'adm-input--error' : ''}`}
                        placeholder={activePlaceholder}
                        value={form.url}
                        onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                      />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">Preview Image <span className="adm-optional">(optional)</span></label>
                      {/* Hidden native file input */}
                      <input
                        ref={imgInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageFile}
                      />
                      {form.image ? (
                        /* Preview + clear */
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
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Upload trigger button */
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
                    <div className="adm-field">
                      <label className="adm-label">Heading / Title</label>
                      <input
                        className="adm-input"
                        placeholder="e.g. Official Website"
                        value={form.heading}
                        onChange={e => setForm(f => ({ ...f, heading: e.target.value }))}
                      />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">Description <span className="adm-optional">(optional)</span></label>
                      <textarea
                        className="adm-textarea"
                        placeholder="Short description shown below the card…"
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <button
                      className={`adm-submit-btn ${addSuccess ? 'adm-submit-btn--success' : ''}`}
                      onClick={handleAddItem}
                    >
                      {addSuccess ? '✓ Added!' : '+ Add Website'}
                    </button>
                  </>
                )}

                {formError && <p className="adm-error">{formError}</p>}
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
                                        >
                                          ✕ Remove
                                        </button>
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

                                <div className="adm-field">
                                  <label className="adm-label">Heading / Title</label>
                                  <input
                                    className="adm-input"
                                    value={editForm.heading}
                                    onChange={e => setEditForm(f => ({ ...f, heading: e.target.value }))}
                                  />
                                </div>

                                <div className="adm-field">
                                  <label className="adm-label">Description</label>
                                  <textarea
                                    className="adm-textarea"
                                    value={editForm.description}
                                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                    rows={2}
                                  />
                                </div>
                              </>
                            )}

                            {editError && <p className="adm-error">{editError}</p>}

                            <div className="adm-edit-actions">
                              <button
                                type="button"
                                className="adm-btn-save"
                                onClick={() => handleSaveEdit(item.id, item.type)}
                              >
                                ✓ Save Changes
                              </button>
                              <button
                                type="button"
                                className="adm-btn-cancel"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="adm-item">
                        {/* Show thumbnail for website items */}
                        {item.type === 'website' && item.image && (
                          <img src={item.image} alt={item.heading || 'preview'} className="adm-item-thumb" />
                        )}
                        <div
                          className="adm-item-type-dot"
                          style={{ background: TYPE_COLOR[item.type] || '#666' }}
                          title={item.type}
                        />
                        <div className="adm-item-info">
                          <div className="adm-item-top">
                            <span
                              className="adm-item-type-label"
                              style={{ color: TYPE_COLOR[item.type] }}
                            >
                              {TYPE_OPTIONS.find(t => t.value === item.type)?.label || item.type}
                            </span>
                            {item.heading && <span className="adm-item-heading">{item.heading}</span>}
                          </div>
                          <p className="adm-item-url" title={item.url}>{item.url}</p>
                          {item.description && (
                            <p className="adm-item-desc">{item.description}</p>
                          )}
                        </div>
                        <div className="adm-item-actions">
                          <button
                            className="adm-item-edit"
                            onClick={() => handleStartEdit(item)}
                            title="Edit item"
                          >
                            Edit
                          </button>
                          <button
                            className="adm-item-delete"
                            onClick={() => handleDeleteItem(selectedCat.id, item.id)}
                            title="Delete item"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
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
    width: 280px; min-height: 100vh;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: sticky; top: 0; height: 100vh; overflow-y: auto;
    box-shadow: 2px 0 12px rgba(0,0,0,0.03);
  }
  .adm-sidebar-top {
    padding: 16px;
    border-bottom: 1px solid var(--border);
  }
  .adm-view-btn {
    display: block; font-size: 13px; font-weight: 600; color: #4d2c7b;
    padding: 10px 14px; border-radius: 8px;
    background: #f0ecf8; border: 1px solid rgba(77,44,123,0.15);
    text-align: center; transition: all 0.2s;
  }
  .adm-view-btn:hover { background: #4d2c7b; color: #ffffff; }

  /* ── Sidebar sections ── */
  .adm-section { padding: 16px; border-bottom: 1px solid var(--border); }
  .adm-section--grow { flex: 1; display: flex; flex-direction: column; gap: 10px; border-bottom: none; }
  .adm-section-label {
    font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;
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
    background: #ede9f6; padding: 2px 7px; border-radius: 20px;
    font-weight: 600;
  }

  /* ── Main ── */
  .adm-main { flex: 1; padding: 40px 48px; overflow-y: auto; }

  /* ── No selection ── */
  .adm-no-select {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; gap: 12px; color: var(--muted); text-align: center;
  }
  .adm-no-select-icon { font-size: 36px; opacity: 0.4; }
  .adm-no-select-text { font-size: 17px; font-weight: 600; color: var(--text); }
  .adm-no-select-sub { font-size: 14px; }

  /* ── Main header ── */
  .adm-main-header { margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; }
  .adm-main-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 32px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; color: #1a1020;
  }
  .adm-main-sub { font-size: 13px; color: var(--muted); font-weight: 500; }
  .adm-close-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--muted);
    background: #ffffff; border: 1px solid var(--border);
    cursor: pointer;
    transition: all 0.18s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }
  .adm-close-btn:hover {
    color: #dc2626;
    border-color: rgba(220,38,38,0.3);
    background: #fef2f2;
    transform: scale(1.08);
  }

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
    background: #ffffff; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .adm-type-chip:hover { color: var(--text); border-color: var(--accent); }
  .adm-type-chip--active { font-weight: 600; background: rgba(77,44,123,0.06); }
  .adm-chip-icon { display: flex; align-items: center; }
  .adm-url-inline-row { display: flex; gap: 8px; align-items: center; width: 100%; }
  .adm-inline-add-btn {
    background: #4d2c7b; color: #fff;
    padding: 9px 18px; border-radius: 9px; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; font-family: inherit; flex-shrink: 0;
    white-space: nowrap; transition: opacity 0.18s;
  }
  .adm-inline-add-btn:hover { opacity: 0.9; }
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
    border: none; cursor: pointer; font-family: inherit;
    transition: all 0.2s; width: 100%;
  }
  .adm-submit-btn:hover { opacity: 0.9; }
  .adm-submit-btn--success { background: #16a34a; }

  /* ── Items list ── */
  .adm-items-section { }
  .adm-items-header {
    display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px;
  }
  .adm-items-title {
    font-size: 15px; font-weight: 700; color: #1a1020;
    display: flex; align-items: center; gap: 8px;
  }
  /* Filter tabs below the title */
  .adm-items-filter {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .adm-filter-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 500;
    border: 1.5px solid rgba(0,0,0,0.10); color: var(--muted);
    background: #ffffff; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .adm-filter-chip:hover { color: var(--text); border-color: rgba(0,0,0,0.25); }
  .adm-filter-chip--active { font-weight: 600; }
  .adm-filter-count {
    font-size: 11px; font-weight: 700;
    background: rgba(0,0,0,0.06); border-radius: 20px;
    padding: 1px 7px; min-width: 20px; text-align: center;
  }
  .adm-filter-chip--active .adm-filter-count {
    background: rgba(0,0,0,0.10);
  }
  .adm-items-empty {
    text-align: center; padding: 40px 20px;
    color: var(--muted); font-size: 14px;
    background: var(--surface); border-radius: 14px; border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 6px;
  }
  .adm-items-list { display: flex; flex-direction: column; gap: 10px; }
  .adm-item {
    display: flex; align-items: flex-start; gap: 14px;
    background: var(--surface); border-radius: 13px; padding: 16px;
    border: 1px solid var(--border); transition: all 0.15s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
  }
  .adm-item:hover { background: #fcfbfe; border-color: var(--accent); }
  .adm-item-type-dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
  }
  .adm-item-info { flex: 1; overflow: hidden; display: flex; flex-direction: column; gap: 4px; }
  .adm-item-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .adm-item-type-label { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }
  .adm-item-heading { font-size: 13px; font-weight: 600; color: var(--text); }
  .adm-item-url {
    font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .adm-item-desc { font-size: 12px; color: var(--muted); }
  .adm-item-delete {
    flex-shrink: 0; padding: 6px 12px; border-radius: 7px;
    font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
    border: 1px solid rgba(220,38,38,0.2);
    background: rgba(220,38,38,0.06); color: var(--danger);
    transition: background 0.15s;
  }
  .adm-item-delete:hover { background: rgba(220,38,38,0.15); }
  /* Item actions */
  .adm-item-actions {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }
  .adm-item-edit {
    padding: 6px 12px; border-radius: 7px;
    font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
    border: 1px solid rgba(77,44,123,0.2);
    background: rgba(77,44,123,0.06); color: var(--accent);
    transition: all 0.15s;
  }
  .adm-item-edit:hover { background: #4d2c7b; color: #ffffff; }

  .adm-item--editing {
    border-color: var(--accent) !important;
    background: #fcfbfe !important;
    box-shadow: 0 4px 16px rgba(77,44,123,0.12);
  }
  .adm-edit-form {
    width: 100%; display: flex; flex-direction: column; gap: 14px;
  }
  .adm-edit-header {
    margin-bottom: 2px;
  }
  .adm-edit-actions {
    display: flex; gap: 10px; margin-top: 4px;
  }
  .adm-btn-save {
    background: #16a34a; color: #fff;
    padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
    border: none; cursor: pointer; font-family: inherit;
    transition: opacity 0.18s;
  }
  .adm-btn-save:hover { opacity: 0.9; }
  .adm-btn-cancel {
    background: #ffffff; color: var(--muted);
    padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
    border: 1px solid var(--border); cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .adm-btn-cancel:hover { color: var(--text); background: #f3f4f6; }
  /* Thumbnail in items list */
  .adm-item-thumb {
    width: 72px; height: 46px; object-fit: cover;
    border-radius: 7px; flex-shrink: 0; margin-top: 2px;
    border: 1px solid var(--border);
  }
  /* Image upload */
  .adm-img-upload-btn {
    width: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    padding: 28px 20px;
    border: 2px dashed rgba(77,44,123,0.25); border-radius: 12px;
    background: #f8f6fc; color: var(--accent);
    font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
    transition: all 0.18s;
  }
  .adm-img-upload-btn:hover {
    border-color: var(--accent); background: #ede9f6;
  }
  .adm-img-upload-hint {
    font-size: 11px; font-weight: 400; color: var(--muted);
  }
  .adm-img-upload-preview {
    display: flex; flex-direction: column; gap: 10px;
  }
  .adm-img-preview {
    width: 100%; height: 160px; object-fit: cover; display: block;
    border-radius: 10px; border: 1px solid var(--border);
  }
  .adm-img-upload-meta {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .adm-img-filename {
    font-size: 12px; color: var(--muted);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;
  }
  .adm-img-clear-btn {
    font-size: 12px; font-weight: 600; color: var(--danger);
    background: rgba(220,38,38,0.07); border: 1px solid rgba(220,38,38,0.2);
    padding: 4px 10px; border-radius: 6px; cursor: pointer; font-family: inherit;
    flex-shrink: 0; transition: background 0.15s;
  }
  .adm-img-clear-btn:hover { background: rgba(220,38,38,0.16); }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .adm { flex-direction: column; }
    .adm-sidebar { width: 100%; height: auto; position: relative; }
    .adm-main { padding: 28px 20px; }
    .adm-cats { max-height: 200px; }
  }
`;
