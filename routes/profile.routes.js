import express from 'express';
import { fetchUserProfile } from '../controllers/profile.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/profile', verifyToken, fetchUserProfile);

export default router;
