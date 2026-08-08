# Shankara Online Portfolio

A full-stack portfolio web application for **ShankaraOnline / WorkFrame** that showcases Instagram Reels, YouTube Videos, and client websites — with a secure admin panel to manage all content dynamically.

---

## 🌐 Live Preview

> Deploy on Vercel and add your live URL here.

---

## ✨ Features

### Public Portfolio
- 📸 **Instagram Reels** — embedded vertical reel player with tap-to-replay
- 🎬 **YouTube Videos & Shorts** — embedded auto-play video player (16:9 and 9:16 layouts)
- 🌍 **Websites** — card grid with image thumbnails, descriptions, and visit links
- 🔗 **Behance** — direct external link to Behance profile
- 📂 **Category filtering** — switch between content categories via pill navigation
- 📱 **Fully responsive** — desktop grid + mobile hamburger menu
- ⚡ **Offline fallback** — uses localStorage when the server is unreachable

### Admin Panel (Password Protected)
- 🔐 **Login** — authenticated via MongoDB or hardcoded fallback credentials
- ➕ **Add / Delete categories** — organise content into named groups
- ➕ **Add items** — paste Instagram, YouTube, or website URLs with heading, description, and image
- ✏️ **Edit items** — update any item details inline
- 🗑️ **Delete items** — remove individual content items
- 🖼️ **Image upload** — pick a local image (converted to base64) for website card thumbnails
- 💾 **Persistent storage** — all changes sync to MongoDB Atlas with localStorage as backup

---

## 🗂️ Project Structure

```
Shankara-Online-Portfolio/
├── client/                        # Frontend (React + Vite)
│   ├── api/
│   │   └── index.js               # Vercel serverless API function (self-contained)
│   ├── public/
│   │   ├── logo.png               # Main brand logo
│   │   ├── New_Logo.png
│   │   ├── Admin-page-logo.png
│   │   └── .htaccess
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Portfolio.jsx      # Public portfolio page
│   │   │   └── Admin.jsx          # Admin dashboard
│   │   ├── utils/
│   │   │   ├── api.js             # API calls with localStorage fallback
│   │   │   └── storage.js         # localStorage read/write helpers
│   │   ├── App.jsx                # Root component — hash-based routing (#admin)
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Global styles
│   ├── dist/                      # Vite production build output
│   ├── index.html                 # HTML entry point
│   ├── vite.config.js             # Vite configuration
│   ├── vercel.json                # Vercel routing rules
│   ├── package.json               # Frontend dependencies & scripts
│   └── package-lock.json
│
├── server/                        # Backend (Express + MongoDB)
│   ├── models/
│   │   ├── Category.js            # Mongoose Category schema
│   │   └── User.js                # Mongoose User schema
│   ├── routes/
│   │   └── api.js                 # All REST API route handlers
│   ├── index.js                   # Express server entry point
│   ├── .env                       # Environment variables (not committed)
│   ├── package.json               # Backend dependencies & scripts
│   └── package-lock.json
│
└── .gitignore
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 8 |
| Styling | Vanilla CSS (inline in components) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Serverless API | Vercel Functions (`client/api/index.js`) |
| Deployment | Vercel (frontend + API) |
| Fonts | Google Fonts — Poppins |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repository

```bash
git clone https://github.com/shankaraonline/Portfolio-Management.git
cd Portfolio-Management
```

### 2. Set up the Backend (server/)

```bash
cd server
npm install
```

Create a `.env` file inside `server/`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ShankaraOnline-Portfolio
PORT=5000
```

Start the backend server:

```bash
npm run dev       # Development (nodemon)
# or
npm start         # Production
```

Server runs at: `http://localhost:5000`

### 3. Set up the Frontend (client/)

```bash
cd client
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

> The frontend automatically connects to the backend. If the server is unreachable, it silently falls back to **localStorage**.

---

## 🔐 Admin Access

Navigate to `http://localhost:5173/#admin` to open the Admin panel.

**Default credentials** are configured via environment variables or set during initial setup.

> ⚠️ Never share or commit your admin credentials publicly. Keep them in `.env` files only.

---

## ☁️ Deploying to Vercel

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. Set **Root Directory** → `client`
4. **Build Command** → `npm run build` *(auto-detected)*
5. **Output Directory** → `dist` *(auto-detected)*

### 3. Add Environment Variables
In **Vercel Dashboard → Project → Settings → Environment Variables**:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |

### 4. Deploy
Click **Deploy**. Vercel will build and deploy the frontend and serverless API automatically.

---

## 🔌 API Endpoints

All endpoints are available at `/api/...` (handled by `client/api/index.js` on Vercel).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate admin user |
| `GET` | `/api/portfolio` | Fetch all categories and items |
| `POST` | `/api/categories` | Create a new category |
| `DELETE` | `/api/categories/:id` | Delete a category |
| `POST` | `/api/categories/:catId/items` | Add an item to a category |
| `PUT` | `/api/categories/:catId/items/:itemId` | Update an item |
| `DELETE` | `/api/categories/:catId/items/:itemId` | Delete an item |
| `GET` | `/health` | API health check |

---

## 🗄️ Database Schema

### Category
```js
{
  id:        String,   // unique identifier
  name:      String,   // category display name
  items:     [Item],   // list of content items
  createdAt: Date
}
```

### Item
```js
{
  id:          String,  // unique identifier
  type:        String,  // 'instagram' | 'youtube' | 'website'
  url:         String,  // content URL
  heading:     String,  // optional title
  description: String,  // optional description
  image:       String,  // optional base64 thumbnail (websites only)
  createdAt:   Date
}
```

### User
```js
{
  username:  String,   // admin username
  password:  String,   // admin password
  role:      String,   // 'admin'
  timestamps: true
}
```

---

## 📜 Available Scripts

### Frontend (`client/`)
```bash
npm run dev        # Start Vite development server
npm run build      # Build for production → dist/
npm run preview    # Preview production build locally
```

### Backend (`server/`)
```bash
npm run dev        # Start with nodemon (auto-reload)
npm start          # Start production server
```

---

## 📄 License

This project is private and proprietary.
© 2025 ShankaraOnline / WorkFrame. All rights reserved.
