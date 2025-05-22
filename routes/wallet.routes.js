import express from 'express';
import {
  deposit,
  withdraw,
  transfer,
  getHistory
} from '../controllers/wallet.controller.js';

import { verifyToken } from '../middleware/auth.middleware.js'; // ensure only logged-in users

const router = express.Router();

router.post('/deposit', verifyToken, deposit);
router.post('/withdraw', verifyToken, withdraw);
router.post('/transfer', verifyToken, transfer);
router.get('/history', verifyToken, getHistory);

export default router;
