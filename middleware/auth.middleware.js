import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Middleware to protect routes using JWT
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied: No token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decodedPayload.id).select('-passwordHash');

    if (!currentUser) {
      return res.status(401).json({ message: 'Access denied: User not found' });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
