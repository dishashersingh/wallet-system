import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const flagSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  message: { type: String },
  transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  createdAt: { type: Date, default: Date.now }
});

const Flag = model('Flag', flagSchema);

export default Flag;
