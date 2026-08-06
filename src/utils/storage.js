const KEY = 'shankara_portfolio_v2';

const DEFAULTS = {
  categories: [],
  logoUrl: '',
  portfolioTitle: 'Shankara Online Portfolio',
};

export function getData() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function addCategory(name) {
  const d = getData();
  d.categories.push({ id: uid(), name: name.trim(), items: [] });
  return save(d);
}

export function deleteCategory(id) {
  const d = getData();
  d.categories = d.categories.filter(c => c.id !== id);
  return save(d);
}

export function addItem(catId, item) {
  const d = getData();
  const cat = d.categories.find(c => c.id === catId);
  if (cat) cat.items.push({ id: uid(), ...item });
  return save(d);
}

export function deleteItem(catId, itemId) {
  const d = getData();
  const cat = d.categories.find(c => c.id === catId);
  if (cat) cat.items = cat.items.filter(i => i.id !== itemId);
  return save(d);
}

export function updateItem(catId, itemId, updatedFields) {
  const d = getData();
  const cat = d.categories.find(c => c.id === catId);
  if (cat) {
    const idx = cat.items.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      cat.items[idx] = { ...cat.items[idx], ...updatedFields };
    }
  }
  return save(d);
}

export function updateMeta(updates) {
  return save({ ...getData(), ...updates });
}
