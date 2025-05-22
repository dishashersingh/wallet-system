import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';
import { runFraudCheck } from '../utils/fraudCheck.js';

const BONUS_CONVERSION_RATE = 150;

// POST /api/wallet/deposit
export const deposit = async (req, res) => {
  const { amount, currency = 'INR' } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid deposit amount' });
  }

  try {
    const user = req.user;
    const existing = user.balances.get(currency) || 0;
    user.balances.set(currency, existing + amount);

    const gemsEarned = Math.floor(amount / BONUS_CONVERSION_RATE);
    if (gemsEarned > 0) {
      const currentGems = user.bonuses.get('GEMS') || 0;
      user.bonuses.set('GEMS', currentGems + gemsEarned);
    }

    await user.save();

    await Transaction.create({
      sender: null,
      receiver: user._id,
      amount,
      currency,
      type: 'deposit',
      metadata: { method: 'manual' }
    });

    if (gemsEarned > 0) {
      await Transaction.create({
        sender: null,
        receiver: user._id,
        amount: gemsEarned,
        currency: 'GEMS',
        type: 'bonus-gems', // ✅ Fixed here
        metadata: { reason: 'Deposit Reward' }
      });
    }

    res.status(200).json({
      message: 'Deposit successful',
      balance: user.balances.get(currency),
      bonusGems: gemsEarned
    });
  } catch (error) {
    console.error('Deposit Error:', error.message);
    res.status(500).json({ message: 'Deposit failed', error: error.message });
  }
};

// POST /api/wallet/withdraw
export const withdraw = async (req, res) => {
  const { amount, currency = 'INR' } = req.body;

  try {
    const user = req.user;
    const current = user.balances.get(currency) || 0;

    if (!amount || amount <= 0 || amount > current) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    user.balances.set(currency, current - amount);
    await user.save();

    const txn = await Transaction.create({
      sender: user._id,
      receiver: null,
      amount,
      currency,
      type: 'withdraw',
      metadata: { method: 'manual' }
    });

    await runFraudCheck({ user, transaction: txn, type: 'withdraw' }); // ✅ Use correct function if renamed

    res.status(200).json({
      message: 'Withdrawal successful',
      balance: user.balances.get(currency)
    });
  } catch (error) {
    console.error('Withdraw Error:', error.message);
    res.status(500).json({ message: 'Withdrawal failed', error: error.message });
  }
};

// POST /api/wallet/transfer
export const transfer = async (req, res) => {
  const { email, amount, currency = 'INR' } = req.body;

  try {
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Transfer amount must be positive' });
    }

    const receiver = await User.findOne({ email });
    if (!receiver || receiver._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Invalid recipient' });
    }

    const sender = req.user;
    const senderBalance = sender.balances.get(currency) || 0;
    if (senderBalance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      sender.balances.set(currency, senderBalance - amount);
      const receiverBalance = receiver.balances.get(currency) || 0;
      receiver.balances.set(currency, receiverBalance + amount);

      await sender.save({ session });
      await receiver.save({ session });

      const [txn] = await Transaction.create([{
        sender: sender._id,
        receiver: receiver._id,
        amount,
        currency,
        type: 'transfer',
        metadata: { description: 'Wallet Transfer' }
      }], { session });

      await session.commitTransaction();
      session.endSession();

      await runFraudCheck({ user: sender, transaction: txn, type: 'transfer' });

      res.status(200).json({ message: 'Transfer successful' });
    } catch (innerErr) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transfer Transaction Failed:', innerErr.message);
      res.status(500).json({ message: 'Transfer failed. Rolled back.' });
    }
  } catch (err) {
    console.error('Transfer Error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/wallet/history
export const getHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    })
      .sort({ timestamp: -1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Transaction History Error:', error.message);
    res.status(500).json({ message: 'Failed to retrieve history', error: error.message });
  }
};
