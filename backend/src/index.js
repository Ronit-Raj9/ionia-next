import "dotenv/config";

import mongoose from 'mongoose';
import {DB_NAME} from "./constants.js";
import connectDB from './db/db.js';
import {app} from './app.js';

connectDB()
.then((connection) => {
    try {
        if (connection) {
            console.log("✅ Database connected successfully");
        } else {
            console.log("⚠️ Database connection failed, running with limited functionality");
        }
        
        app.listen(process.env.PORT || 4000, () => {
            console.log(`🚀 Server is running at port : ${process.env.PORT || 4000}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔒 HTTPS Enabled: ${process.env.HTTPS_ENABLED || 'false'}`);
        });
        
        app.on('error', (error) => {
            console.error("❌ Server error:", error);
            throw error;
        });        
    } catch (error) {
        console.error("❌ Server startup error:", error);
        throw error;
    }
})
.catch((error) => {
    console.error("❌ Database connection failed:", error);
    // Don't exit - let the server start with limited functionality
    console.log("⚠️ Starting server with limited functionality...");
    
    app.listen(process.env.PORT || 4000, () => {
        console.log(`🚀 Server is running at port : ${process.env.PORT || 4000} (Limited Mode)`);
    });
})