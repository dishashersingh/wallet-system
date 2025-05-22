import Flag from '../models/flag.model.js';
import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';

//Calculate total balances across all users
const calculateTotalBalances = (users) => {
  const totals = {};
  for (const user of users) {
    for (const [currency, amount] of user.balances.entries()) {
      totals[currency] = (totals[currency] || 0) + amount;
    }
  }
  return totals;
};

// GET /api/admin/flags - View all flagged transactions
export const getFlags = async (req, res) => {
  try {
    const flags = await Flag.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('transaction');

    res.json({ flags });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch flags', error: error.message });
  }
};

// GET /api/admin/total-balances - sum total balances of all users
export const getTotalBalances = async (req, res) => {
  try {
    const users = await User.find();
    const totalBalances = calculateTotalBalances(users);
    res.json({ totalBalances });
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate total balances', error: error.message });
  }
};

// GET /api/admin/top-users - Top 5 users by balance and transaction count
export const getTopUsers = async (req, res) => {
  try {
    const users = await User.find();

    const topByBalance = users
      .map(user => ({
        name: user.name,
        email: user.email,
        totalBalance: [...user.balances.values()].reduce((sum, curr) => sum + curr, 0)
      }))
      .sort((a, b) => b.totalBalance - a.totalBalance)
      .slice(0, 5);

    const txCounts = await Transaction.aggregate([
      { $match: { sender: { $ne: null } } },
      { $group: { _id: '$sender', txCount: { $sum: 1 } } },
      { $sort: { txCount: -1 } },
      { $limit: 5 }
    ]);

    const topByTx = await Promise.all(txCounts.map(async ({ _id, txCount }) => {
      const user = await User.findById(_id);
      return {
        name: user?.name || 'Unknown',
        email: user?.email || 'Unknown',
        transactionCount: txCount
      };
    }));

    res.json({
      topUsersByBalance: topByBalance,
      topUsersByTransactions: topByTx
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve top users', error: error.message });
  }
};

// PATCH /api/admin/user/:id/delete - Soft delete a user
export const softDeleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!result) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User marked as deleted ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to soft delete user', error: error.message });
  }
};

// PATCH /api/admin/transaction/:id/delete - Soft delete a transaction
export const softDeleteTransaction = async (req, res) => {
  try {
    const result = await Transaction.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!result) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction marked as deleted ✅' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to soft delete transaction', error: error.message });
  }
};
