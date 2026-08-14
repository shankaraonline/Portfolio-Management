import express from 'express';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

const router = express.Router();

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Auto-seed default SuperAdmin user if not existing
async function seedDefaultAdmin() {
  try {
    const existing = await User.findOne({ username: 'ShankaraSuperAdmin' });
    if (!existing) {
      const adminUser = new User({
        username: 'ShankaraSuperAdmin',
        password: 'ShankaraSuperAdmin513',
        role: 'admin'
      });
      await adminUser.save();
      console.log('👤 Default admin user (ShankaraSuperAdmin) seeded in MongoDB.');
    }
  } catch (err) {
    console.warn('⚠️ Could not seed admin user:', err.message);
  }
}
seedDefaultAdmin();

/* ── POST /api/login ── */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Hardcoded fallback check for local/offline resilience
    if (username.trim() === 'ShankaraSuperAdmin' && password.trim() === 'ShankaraSuperAdmin513') {
      return res.json({
        success: true,
        user: { username: 'ShankaraSuperAdmin', role: 'admin' },
        token: 'auth_token_' + uid()
      });
    }

    // Check MongoDB database
    const user = await User.findOne({ username: username.trim(), password: password.trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json({
      success: true,
      user: { username: user.username, role: user.role },
      token: 'auth_token_' + uid()
    });
  } catch (err) {
    // Fallback if DB error
    if (req.body.username === 'ShankaraSuperAdmin' && req.body.password === 'ShankaraSuperAdmin513') {
      return res.json({
        success: true,
        user: { username: 'ShankaraSuperAdmin', role: 'admin' },
        token: 'auth_token_' + uid()
      });
    }
    res.status(500).json({ error: 'Login server error', message: err.message });
  }
});

/* ── GET /api/portfolio ── */
router.get('/portfolio', async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    const orderSetting = await Settings.findOne({ key: 'websiteOrder' });
    res.json({
      categories,
      settings: { websiteOrder: orderSetting?.value || [] }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio data', message: err.message });
  }
});

/* ── POST /api/categories ── */
router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const count = await Category.countDocuments();
    const newCat = new Category({
      id: uid(),
      name: name.trim(),
      description: description ? description.trim() : '',
      items: [],
      order: count
    });
    await newCat.save();
    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.status(201).json({ categories, category: newCat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category', message: err.message });
  }
});

/* ── PUT /api/categories/:id ── */
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const cat = await Category.findOne({ id });
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (name !== undefined) cat.name = name.trim();
    if (description !== undefined) cat.description = description.trim();
    await cat.save();
    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ categories, category: cat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category', message: err.message });
  }
});

/* ── PUT /api/categories/reorder ── */
// Reorders all categories globally.
// Body: { categoryIds: [catId1, catId2, ...] }
router.put('/categories/reorder', async (req, res) => {
  try {
    const { categoryIds } = req.body;
    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'categoryIds array is required' });
    }
    const bulkOps = categoryIds.map((id, index) => ({
      updateOne: {
        filter: { id },
        update: { $set: { order: index } }
      }
    }));
    if (bulkOps.length > 0) {
      await Category.bulkWrite(bulkOps);
    }
    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder categories', message: err.message });
  }
});

/* ── DELETE /api/categories/:id ── */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Category.deleteOne({ id });
    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category', message: err.message });
  }
});

/* ── POST /api/categories/:catId/items ── */
router.post('/categories/:catId/items', async (req, res) => {
  try {
    const { catId } = req.params;
    const { type, url, heading, description, image } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const cat = await Category.findOne({ id: catId });
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newItem = {
      id: uid(),
      type: type || 'instagram',
      url: url.trim(),
      heading: heading || '',
      description: description || '',
      image: image || ''
    };

    cat.items.push(newItem);
    await cat.save();

    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.status(201).json({ categories, item: newItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item', message: err.message });
  }
});

/* ── PUT /api/categories/:catId/items/:itemId ── */
router.put('/categories/:catId/items/:itemId', async (req, res) => {
  try {
    const { catId, itemId } = req.params;
    const { url, heading, description, image } = req.body;

    const cat = await Category.findOne({ id: catId });
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const item = cat.items.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (url !== undefined) item.url = url.trim();
    if (heading !== undefined) item.heading = heading.trim();
    if (description !== undefined) item.description = description.trim();
    if (image !== undefined) item.image = image.trim();

    await cat.save();

    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ categories, item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item', message: err.message });
  }
});

/* ── DELETE /api/categories/:catId/items/:itemId ── */
router.delete('/categories/:catId/items/:itemId', async (req, res) => {
  try {
    const { catId, itemId } = req.params;

    const cat = await Category.findOne({ id: catId });
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    cat.items = cat.items.filter(i => i.id !== itemId);
    await cat.save();

    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item', message: err.message });
  }
});

/* ── PUT /api/categories/:catId/reorder ── */
// Reorders items of a specific type within a category.
// Body: { type: 'instagram'|'youtube'|'website', itemIds: [id1, id2, ...] }
router.put('/categories/:catId/reorder', async (req, res) => {
  try {
    const { catId } = req.params;
    const { type, itemIds } = req.body;
    if (!type || !Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'type and itemIds array are required' });
    }
    const cat = await Category.findOne({ id: catId });
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    // Build a lookup for the new order of the target type
    const typeMap = {};
    cat.items.filter(i => i.type === type).forEach(i => { typeMap[i.id] = i; });
    const typeItemsOrdered = itemIds.map(id => typeMap[id]).filter(Boolean);

    // Replace same-type items in-place with their new order
    let typeIdx = 0;
    cat.items = cat.items.map(item =>
      item.type === type ? (typeItemsOrdered[typeIdx++] || item) : item
    );
    cat.markModified('items');
    await cat.save();

    const categories = await Category.find({}).sort({ order: 1, createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder items', message: err.message });
  }
});

/* ── PUT /api/settings/website-order ── */
// Saves the global display order for all website items.
// Body: { itemIds: [id1, id2, ...] }
router.put('/settings/website-order', async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ error: 'itemIds array is required' });
    }
    await Settings.findOneAndUpdate(
      { key: 'websiteOrder' },
      { value: itemIds },
      { upsert: true, new: true }
    );
    res.json({ success: true, websiteOrder: itemIds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update website order', message: err.message });
  }
});

export default router;
