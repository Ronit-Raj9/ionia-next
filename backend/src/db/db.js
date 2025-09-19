import mongoose from "mongoose";
import { DB_NAME} from "../constants.js";

const connectDB = async (retries = 5) => {
    const dbUri = process.env.DATABASE_ATLAS.replace("<DB_NAME>", DB_NAME);
    
    // Log connection details (without sensitive info)
    console.log(`🔗 Connecting to MongoDB Atlas...`);
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`MongoDB connection attempt ${i + 1}/${retries}`);
            
            const connectionInstance = await mongoose.connect(dbUri, {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
                // Modern MongoDB options
                retryWrites: true,
                w: 'majority'
            });
            
            console.log(`✅ MongoDB connected successfully! DB HOST: ${connectionInstance.connection.host}`);
            
            // Set up connection event handlers
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });
            
            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected');
            });
            
            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
            });
            
            return connectionInstance;
            
        } catch (err) {
            console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, err.message);
            
            if (i === retries - 1) {
                console.error("🚨 MongoDB connection failed after all retries");
                console.error("⚠️ Application will continue with degraded functionality");
                // Don't exit the process - let the app run with limited functionality
                return null;
            }
            
            // Exponential backoff: 5s, 10s, 20s, 40s
            const delay = 5000 * Math.pow(2, i);
            console.log(`⏳ Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

export default connectDB; 
