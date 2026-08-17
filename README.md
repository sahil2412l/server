# Secure Express Backend Server

Enterprise-grade, secure Node.js + Express backend API with JWT Authentication, Payments, Messaging, File Uploads, Coins & Rank Engine, and Location Tracking.

## 🚀 Features

- 🔐 **Dual-Login Auth**: Register and log in using either **Username** or **Mobile Number** with Password.
- 🛡️ **Security Stack**: Helmet HTTP headers, Rate Limiting (Brute-force protection), NoSQL injection defense, and input validation.
- 🪵 **Winston Logging**: Structured logging to console and rotated file logs (`logs/error.log`, `logs/combined.log`).
- 💎 **Coins & Rank Engine**: Auto-calculated ranks based on coin balance (Bronze, Silver, Gold, Platinum, Diamond).
- 💳 **Payments & Discounts**: Purchase coins, apply promo codes, and record transaction history.
- 💬 **Messaging System**: Direct messaging between users with read state tracking.
- 📁 **File Uploads**: Secure Multer file upload with type whitelist and 5MB limit.

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/secure_backend_db
JWT_SECRET=super_secret_jwt_key_12345
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### 3. Run Locally
```bash
# Development Mode
npm run dev

# Production Mode
npm start
```

## 🌐 Deploying to Render.com

1. Push code to GitHub repository.
2. Open [Render Dashboard](https://render.com) and click **New +** -> **Web Service**.
3. Connect repository `sahil2412l/server`.
4. Configure Build Command: `npm install` and Start Command: `npm start`.
5. Set Environment Variables (`MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`).
6. Click **Deploy**.
