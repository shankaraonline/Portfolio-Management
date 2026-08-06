import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import apiRoutes from '../server/routes/api.js';

dotenv.config();

const app = express();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shankara_online:ssrs513JGD@cluster0.yqh4o6e.mongodb.net/ShankaraOnline-Portfolio?retryWrites=true&w=majority&appName=Cluster0';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serverless DB Connection Middleware
let isConnected = false;
app.use(async (req, res, next) => {
  if (!isConnected && mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(MONGODB_URI, { family: 4, serverSelectionTimeoutMS: 15000 });
      isConnected = true;
      console.log('✅ Serverless DB connected to MongoDB Atlas');
    } catch (err) {
      console.error('❌ Serverless DB Error:', err.message);
    }
  }
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dbState: mongoose.connection.readyState });
});

export default app;
