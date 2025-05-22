import mongoose from 'mongoose';

export async function initializeDatabase() {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);

    console.log('MongoDB connection established successfully.');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}
