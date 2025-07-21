const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const User    = require('../models/User');
const Upload = require('../models/File');
const router  = express.Router();

// ---------- Admin Registration ----------
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashed, role: 'admin' });

    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- Admin Login ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users (with uploads maybe)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // no password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user by id
router.delete('/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    await User.findByIdAndDelete(userId);
    // optionally, delete all uploads by this user as well
    await Upload.deleteMany({ user: userId });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete upload by id
router.delete('/uploads/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const uploadId = req.params.id;
    await Upload.findByIdAndDelete(uploadId);
    res.json({ message: 'Upload deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// (keep your existing /users, /users/:id, /uploads/:id routes here)
module.exports = router;