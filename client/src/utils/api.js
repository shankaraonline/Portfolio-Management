import { getData as getLocalData, addCategory as addLocalCat, deleteCategory as deleteLocalCat, addItem as addLocalItem, deleteItem as deleteLocalItem, updateItem as updateLocalItem } from './storage.js';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE = getApiBase();

/* ── Auth Header Helper ── */
function getAuthHeader() {
  const token = localStorage.getItem('admin_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/* ── Login Authentication ── */
export async function loginApi(username, password) {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Login failed');
    }
    return data;
  } catch (err) {
    // Offline fallback verification
    if (username.trim() === 'ShankaraSuperAdmin' && password.trim() === 'ShankaraSuperAdmin513') {
      return {
        success: true,
        user: { username: 'ShankaraSuperAdmin', role: 'admin' },
        token: 'auth_token_offline'
      };
    }
    throw new Error(err.message || 'Invalid username or password');
  }
}

/* ── Fetch all portfolio data from server (falls back to localStorage) ── */
export async function fetchPortfolioData() {
  try {
    // 10 s timeout — gives cold-starting servers (Render/Vercel free tier) time to wake up
    const res = await fetch(`${API_BASE}/portfolio`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error('API server returned error status');
    const data = await res.json();
    return { ...getLocalData(), categories: data.categories || [] };
  } catch (err) {
    console.warn('⚠️ Server unreachable, using local storage fallback:', err.message);
    return getLocalData();
  }
}

/* ── Add Category ── */
export async function addCategoryApi(name) {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create category');
    const data = await res.json();
    return { ...getLocalData(), categories: data.categories };
  } catch (err) {
    console.warn('⚠️ Server error, writing to local storage:', err.message);
    return addLocalCat(name);
  }
}

/* ── Delete Category ── */
export async function deleteCategoryApi(id) {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete category');
    const data = await res.json();
    return { ...getLocalData(), categories: data.categories };
  } catch (err) {
    console.warn('⚠️ Server error, updating local storage:', err.message);
    return deleteLocalCat(id);
  }
}

/* ── Add Item ── */
export async function addItemApi(catId, itemData) {
  try {
    const res = await fetch(`${API_BASE}/categories/${catId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) throw new Error('Failed to add item');
    const data = await res.json();
    return { ...getLocalData(), categories: data.categories };
  } catch (err) {
    console.warn('⚠️ Server error, writing item to local storage:', err.message);
    return addLocalItem(catId, itemData);
  }
}

/* ── Update Item ── */
export async function updateItemApi(catId, itemId, updatedFields) {
  try {
    const res = await fetch(`${API_BASE}/categories/${catId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updatedFields),
    });
    if (!res.ok) throw new Error('Failed to update item');
    const data = await res.json();
    return { ...getLocalData(), categories: data.categories };
  } catch (err) {
    console.warn('⚠️ Server error, updating item in local storage:', err.message);
    return updateLocalItem(catId, itemId, updatedFields);
  }
}

/* ── Delete Item ── */
export async function deleteItemApi(catId, itemId) {
  try {
    const res = await fetch(`${API_BASE}/categories/${catId}/items/${itemId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to delete item');
    const data = await res.json();
    return { ...getLocalData(), categories: data.categories };
  } catch (err) {
    console.warn('⚠️ Server error, deleting item from local storage:', err.message);
    return deleteLocalItem(catId, itemId);
  }
}
