import dotenv from "dotenv"
import mongoose from 'mongoose';
import { DB_NAME } from "./constants.js";
import connectDB from './db/db.js';
import { app } from './app.js'

dotenv.config({
    path: './.env'
})

connectDB()
.then((connection) => {
    try {
        if (connection) {
            console.log("✅ LMS Database connected successfully");
        } else {
            console.log("⚠️ LMS Database connection failed, running with limited functionality");
        }
        
        app.listen(process.env.PORT || 5000, () => {
            console.log(`🚀 LMS Server is running at port : ${process.env.PORT || 5000}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔒 HTTPS Enabled: ${process.env.HTTPS_ENABLED || 'false'}`);
            console.log(`📚 LMS Service: Learning Management System`);
            console.log(`🔗 Frontend URL: ${process.env.LMS_FRONTEND_URL || 'http://localhost:3001'}`);
        });
        
        app.on('error', (error) => {
            console.error("❌ LMS Server error:", error);
            throw error;
        });        
    } catch (error) {
        console.error("❌ LMS Server startup error:", error);
        throw error;
    }
})
.catch((error) => {
    console.error("❌ LMS Database connection failed:", error);
    console.log("⚠️ Starting LMS server with limited functionality...");
    
    app.listen(process.env.PORT || 5000, () => {
        console.log(`🚀 LMS Server is running at port : ${process.env.PORT || 5000} (Limited Mode)`);
    });
})
