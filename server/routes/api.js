import express from 'express';
import Category from '../models/Category.js';
import User from '../models/User.js';

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
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio data', message: err.message });
  }
});

/* ── POST /api/categories ── */
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCat = new Category({
      id: uid(),
      name: name.trim(),
      items: []
    });
    await newCat.save();
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.status(201).json({ categories, category: newCat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category', message: err.message });
  }
});

/* ── DELETE /api/categories/:id ── */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Category.deleteOne({ id });
    const categories = await Category.find({}).sort({ createdAt: 1 });
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

    const categories = await Category.find({}).sort({ createdAt: 1 });
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

    const categories = await Category.find({}).sort({ createdAt: 1 });
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

    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item', message: err.message });
  }
});

export default router;
