  // const jwt = require('jsonwebtoken');
  // const bcrypt = require('bcryptjs');
  // const User = require('../models/User');

  // const generateToken = (user) => {
  //   return jwt.sign(
  //     { id: user._id, email: user.email, name: user.name, role: user.role },
  //     process.env.JWT_SECRET,
  //     { expiresIn: '7d' }
  //   );
  // };

  // exports.register = async (req, res) => {
  //   const { name, email, password, role } = req.body;
  //   const existingUser = await User.findOne({ email });
  //   if (existingUser) return res.status(400).json({ message: 'User already exists' });

  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   const user = new User({ name, email, password: hashedPassword, role:role?.toLowerCase() || 'user',});
  //   await user.save();

  //   const token = generateToken(user);
  //   res.status(201).json({ token, user });
  //   return res.send("/");
  // };

  // exports.login = async (req, res) => {
  //   const { email, password } = req.body;
  //   const user = await User.findOne({ email });
  //   if (!user || !(await bcrypt.compare(password, user.password))) {
  //     return res.status(400).json({ message: 'Invalid credentials' });
  //   }

  //   const token = generateToken(user);
  //   res.json({ token, user });
  // };


  const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Admin email - only this email can register as admin
const ADMIN_EMAIL = 'jashpandyaa@gmail.com';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper function to determine correct role
const getCorrectRole = (email, requestedRole) => {
  const isAdminEmail = email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (isAdminEmail) {
    return 'admin';
  }
  // Force user role for non-admin emails
  return 'user';
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide name, email, and password' 
      });
    }

    // Check if trying to register as admin with unauthorized email
    if (role === 'admin' && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ 
        message: 'Admin registration is restricted to authorized personnel only' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }

    // Determine the correct role based on email
    const userRole = getCorrectRole(email, role);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with correct role
    const user = new User({ 
      name, 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      role: userRole
    });
    
    await user.save();

    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({ 
      message: 'User registered successfully',
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);
    
    res.json({ 
      token, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};