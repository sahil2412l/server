# Class 10 Math Express Backend Server 🚀

Express.js backend server integrated with MongoDB Atlas for the **Class 10 Math CBSE Mobile Application**.

## 🌟 Key Features

- 🔐 **User Authentication**: JWT-based secure Register, Login, and Profile retrieval (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
- 🏆 **Gamification & Leaderboard**: Track user XP points, daily streaks, level progression, and global rankings (`/api/leaderboard`, `/api/user/points`).
- ❓ **Student Doubts System**: Submit chapter doubts and query status (`/api/doubts`).
- 🍃 **MongoDB Atlas Integration**: Live persistent cloud database.

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env`)
Create a `.env` file in the root of the server directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/class10math?retryWrites=true&w=majority
JWT_SECRET=class10_secret_jwt_key_2026
```

### 3. Run Server
```bash
# Development Mode (auto-reload)
npm run dev

# Production Mode
npm start
```

## 🌐 Deployment

Deployable to [Render](https://render.com), [Railway](https://railway.app), or any Node.js host.
- Build Command: `npm install`
- Start Command: `npm start`
