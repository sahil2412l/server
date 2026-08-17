const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. MONGODB ATLAS CONNECTION
const USER_MONGODB_URI = 'mongodb://lion2412l_db_user:La52CygRmoNDVPnC@ac-gswcdb4-shard-00-00.gwvnlmv.mongodb.net:27017,ac-gswcdb4-shard-00-01.gwvnlmv.mongodb.net:27017,ac-gswcdb4-shard-00-02.gwvnlmv.mongodb.net:27017/class10math?replicaSet=atlas-m2wnex-shard-0&ssl=true&authSource=admin';
const MONGODB_URI = process.env.MONGODB_URI || USER_MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'class10_secret_jwt_key_2026';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Database!'))
  .catch((err) => console.error('❌ MongoDB Atlas Connection Error:', err.message));

// 2. MONGOOSE SCHEMAS

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '🎓' },
  targetScore: { type: String, default: '95%+' },
  points: { type: Number, default: 0 },
  streak: { type: Number, default: 1 },
  lastActiveDate: { type: String, default: '' },
  completedQuestions: [{ type: String }],
  unlockedBadges: [{ type: String, default: 'First Step' }],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Doubt Schema
const DoubtSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String, default: 'Student' },
  subject: { type: String, default: 'Mathematics' },
  chapter: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  reply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const Doubt = mongoose.model('Doubt', DoubtSchema);

// AUTH MIDDLEWARE
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// 3. API ENDPOINTS

// A. REGISTER USER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, targetScore, avatar } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      targetScore: targetScore || '95%+',
      avatar: avatar || '🎓',
      unlockedBadges: ['First Step']
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        targetScore: user.targetScore,
        points: user.points,
        streak: user.streak,
        completedQuestions: user.completedQuestions,
        unlockedBadges: user.unlockedBadges
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// B. LOGIN USER
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        targetScore: user.targetScore,
        points: user.points,
        streak: user.streak,
        completedQuestions: user.completedQuestions,
        unlockedBadges: user.unlockedBadges
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// C. GET CURRENT USER PROFILE
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// D. UPDATE USER POINTS & STREAK (SYNC WITH MONGODB)
app.post('/api/user/points', authMiddleware, async (req, res) => {
  try {
    const { questionId, pointsToAdd } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (questionId && !user.completedQuestions.includes(questionId)) {
      user.completedQuestions.push(questionId);
      user.points += pointsToAdd || 2;

      // Update Badges
      if (user.completedQuestions.length >= 5 && !user.unlockedBadges.includes('Math Scholar')) {
        user.unlockedBadges.push('Math Scholar');
      }
      if (user.points >= 50 && !user.unlockedBadges.includes('Formula Master')) {
        user.unlockedBadges.push('Formula Master');
      }
      if (user.points >= 100 && !user.unlockedBadges.includes('Class 10 Topper')) {
        user.unlockedBadges.push('Class 10 Topper');
      }

      await user.save();
    }

    res.json({
      points: user.points,
      completedQuestions: user.completedQuestions,
      unlockedBadges: user.unlockedBadges
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// E. GET GLOBAL LEADERBOARD (SORTED BY POINTS DESCENDING)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find()
      .select('name avatar points streak level')
      .sort({ points: -1 })
      .limit(50);

    const formatted = leaderboard.map((u, index) => ({
      id: u._id,
      name: u.name,
      avatar: u.avatar || '🎓',
      points: u.points || 0,
      streak: u.streak || 1,
      rank: index + 1,
      level: Math.floor((u.points || 0) / 20) + 1
    }));

    res.json({ leaderboard: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// F. SUBMIT DOUBT TO MONGODB
app.post('/api/doubts', async (req, res) => {
  try {
    const { subject, chapter, message } = req.body;
    const doubt = new Doubt({
      subject: subject || 'Mathematics',
      chapter,
      message,
      studentName: 'Class 10 Student'
    });
    await doubt.save();
    res.json({ doubt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// G. GET ALL DOUBTS FROM MONGODB
app.get('/api/doubts', async (req, res) => {
  try {
    const doubts = await Doubt.find().sort({ createdAt: -1 });
    res.json({ doubts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Class 10 Math Express Server running on http://localhost:${PORT}`);
});
