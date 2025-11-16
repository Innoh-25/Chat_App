import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create default rooms if they don't exist
    await createDefaultRooms();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createDefaultRooms = async () => {
  const Room = (await import('../models/Room.js')).default;
  const defaultRooms = [
    { name: 'general', description: 'General discussions' },
    { name: 'random', description: 'Random chat' },
    { name: 'tech', description: 'Technology talk' }
  ];

  for (const roomData of defaultRooms) {
    await Room.findOneAndUpdate(
      { name: roomData.name },
      roomData,
      { upsert: true, new: true }
    );
  }
  console.log('Default rooms created/verified');
};

export default connectDB;