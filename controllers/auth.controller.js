import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Utility: Sign JWT token
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '1d'
  });
};

// POST /api/auth/register - Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Create and save user
    const newUser = new User({ name, email, passwordHash: password });
    await newUser.save();

    // Return auth token
    const token = createToken(newUser._id);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/auth/login - Login existing user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find active user by email
    const user = await User.findOne({ email, isDeleted: false });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return JWT token
    const token = createToken(user._id);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};
