import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

/* ── Inline Mongoose Models (self-contained for Vercel serverless) ── */

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true, enum: ['instagram', 'youtube', 'website'] },
  url: { type: String, required: true },
  heading: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  items: [itemSchema],
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

// Guard against model re-registration on hot reloads
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

/* ── DB Connection ── */

const MONGODB_URI = process.env.MONGODB_URI; // Set this in Vercel → Settings → Environment Variables

let isConnected = false;

async function connectDB() {
  if (isConnected || mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
    isConnected = true;
    console.log('✅ Serverless DB connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ Serverless DB Error:', err.message);
  }
}

/* ── Helpers ── */

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function seedDefaultAdmin() {
  try {
    const existing = await User.findOne({ username: 'ShankaraSuperAdmin' });
    if (!existing) {
      await new User({ username: 'ShankaraSuperAdmin', password: 'ShankaraSuperAdmin513', role: 'admin' }).save();
      console.log('👤 Default admin user seeded in MongoDB.');
    }
  } catch (err) {
    console.warn('⚠️ Could not seed admin user:', err.message);
  }
}

/* ── Express App ── */

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect DB on every cold start
app.use(async (_req, _res, next) => {
  await connectDB();
  next();
});

/* ── POST /api/login ── */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Hardcoded fallback for resilience
    if (username.trim() === 'ShankaraSuperAdmin' && password.trim() === 'ShankaraSuperAdmin513') {
      return res.json({ success: true, user: { username: 'ShankaraSuperAdmin', role: 'admin' }, token: 'auth_token_' + uid() });
    }

    const user = await User.findOne({ username: username.trim(), password: password.trim() });
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    res.json({ success: true, user: { username: user.username, role: user.role }, token: 'auth_token_' + uid() });
  } catch (err) {
    if (req.body.username === 'ShankaraSuperAdmin' && req.body.password === 'ShankaraSuperAdmin513') {
      return res.json({ success: true, user: { username: 'ShankaraSuperAdmin', role: 'admin' }, token: 'auth_token_' + uid() });
    }
    res.status(500).json({ error: 'Login server error', message: err.message });
  }
});

/* ── GET /api/portfolio ── */
app.get('/api/portfolio', async (_req, res) => {
  try {
    await seedDefaultAdmin();
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio data', message: err.message });
  }
});

/* ── POST /api/categories ── */
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Category name is required' });
    const newCat = new Category({ id: uid(), name: name.trim(), items: [] });
    await newCat.save();
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.status(201).json({ categories, category: newCat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category', message: err.message });
  }
});

/* ── DELETE /api/categories/:id ── */
app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.deleteOne({ id: req.params.id });
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category', message: err.message });
  }
});

/* ── POST /api/categories/:catId/items ── */
app.post('/api/categories/:catId/items', async (req, res) => {
  try {
    const { type, url, heading, description, image } = req.body;
    if (!url || !url.trim()) return res.status(400).json({ error: 'URL is required' });

    const cat = await Category.findOne({ id: req.params.catId });
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    cat.items.push({ id: uid(), type: type || 'instagram', url: url.trim(), heading: heading || '', description: description || '', image: image || '' });
    await cat.save();

    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.status(201).json({ categories, item: cat.items[cat.items.length - 1] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item', message: err.message });
  }
});

/* ── PUT /api/categories/:catId/items/:itemId ── */
app.put('/api/categories/:catId/items/:itemId', async (req, res) => {
  try {
    const { url, heading, description, image } = req.body;
    const cat = await Category.findOne({ id: req.params.catId });
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    const item = cat.items.find(i => i.id === req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });

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
app.delete('/api/categories/:catId/items/:itemId', async (req, res) => {
  try {
    const cat = await Category.findOne({ id: req.params.catId });
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    cat.items = cat.items.filter(i => i.id !== req.params.itemId);
    await cat.save();
    const categories = await Category.find({}).sort({ createdAt: 1 });
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item', message: err.message });
  }
});

/* ── Health Check ── */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

export default app;
