import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_ATLAS}/${DB_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`✅ LMS Database connected successfully: ${connectionInstance.connection.host}`);
    return connectionInstance;
  } catch (error) {
    console.error("❌ LMS Database connection failed:", error);
    throw error;
  }
};

export default connectDB;
