import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const transactionSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  type: {
    type: String,
    enum: [
      'deposit',
      'withdraw',
      'transfer',
      'bonus-gems',
      'bonus-coins',
      'redeem-bonus'
    ],
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  metadata: {
    type: Map,
    of: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Transaction = model('Transaction', transactionSchema);

export default Transaction;
