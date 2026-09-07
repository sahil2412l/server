# 🚀 Real-Time Secure Backend API Server

A scalable and production-ready Node.js & Express backend with MongoDB Atlas integration, Socket.IO real-time broadcasting, JWT dual-token authentication (with token rotation), and a unique coin reward system.

---

## 🌟 Features

- **🔐 Dual Token Authentication:** Access Token (15m) + Refresh Token (7d) with token rotation.
- **⚡ Real-Time Broadcasting (Socket.IO):** Live comments, live reviews, and user performance scoring.
- **🪙 Unique Coin Reward System:** Cryptographically unique coin IDs (`COIN_XXXXXX`), lifetime validity, single-use verification & audit log.
- **🛡️ Enterprise Security:** Helmet HTTP headers, CORS whitelisting, rate-limiting, and sanitized cookie authentication.
- **🐳 Docker Ready:** Multi-stage lightweight Docker image for fast cloud deployments.

---

## 📁 Project Structure

```
Backend/
├── .env.example              # Sample environment variables
├── Dockerfile                # Production Docker configuration
├── .dockerignore             # Excluded files for Docker build
├── .gitignore                # Git ignored files & secrets
├── package.json              # Dependencies and scripts
└── src/
    ├── app.js                # Express app & middleware setup
    ├── server.js             # HTTP & Socket.IO server entry point
    ├── config/               # Database & JWT configurations
    ├── controllers/          # Business logic (Auth, Feedback, Coins)
    ├── middlewares/          # Security, JWT verification & error handlers
    ├── models/               # Mongoose data models
    ├── routes/               # API route definitions
    └── sockets/              # Socket.IO event handlers
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root folder based on `.env.example`:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/dbname?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=https://your-frontend.vercel.app,http://localhost:3000
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```

### 3. Run in Production Mode
```bash
npm start
```

---

## 🐳 Docker Commands

### Build Docker Image
```bash
docker build -t backend-server:latest .
```

### Run Docker Container
```bash
docker run -d -p 5000:5000 --env-file .env --name backend-server backend-server:latest
```

---

## 📡 API Endpoints

### 🔑 Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout & revoke refresh token
- `GET /api/auth/me` - Get current authenticated user profile

### 💬 Real-Time Feedback (`/api/feedback`)
- `POST /api/feedback/comment` - Post comment (broadcasts `comment:new`)
- `POST /api/feedback/review` - Post review/rating (broadcasts `review:new`)
- `POST /api/feedback/performance` - Post score (broadcasts `performance:update`)
- `GET /api/feedback` - Get feed with pagination

### 🪙 Coins System (`/api/coins`)
- `POST /api/coins/earn` - Issue unique coin reward
- `GET /api/coins/my-coins` - Get user's active coins
- `GET /api/coins/verify/:coinId` - Verify coin validity
- `POST /api/coins/verify-and-use` - Redeem and consume coin
- `GET /api/coins/history` - View spent coin audit history

---

## 📄 License
ISC
