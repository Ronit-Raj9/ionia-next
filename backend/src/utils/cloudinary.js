import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

// Validate environment variables
const validateConfig = () => {
    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.warn(`⚠️ Missing Cloudinary environment variables: ${missing.join(', ')}`);
        return false;
    }
    return true;
};

// Configure Cloudinary
const isConfigured = validateConfig();

if (isConfigured) {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log('✅ Cloudinary configured successfully');
} else {
    console.log('⚠️ Cloudinary not configured - image uploads will fail');
}

// Health check function
const checkCloudinaryHealth = async () => {
    if (!isConfigured) {
        throw new Error('Cloudinary not configured - missing environment variables');
    }
    
    try {
        // Try to get account usage info (lightweight check)
        const result = await cloudinary.api.usage();
        return {
            status: 'healthy',
            credits: result.credits,
            lastCheck: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(`Cloudinary API error: ${error.message}`);
    }
};

const uploadOnCloudinary = async (localfilePath) => {
    try {
        if (!isConfigured) {
            console.error("Cloudinary not configured - cannot upload file");
            return null;
        }
        
        if(!localfilePath) return null;
        
        // Check if file exists
        if (!fs.existsSync(localfilePath)) {
            console.error("File does not exist at path:", localfilePath);
            return null;
        }
        
        // Upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: 'auto',
        });

        console.log("File uploaded to Cloudinary successfully:", response.url);

        // Clean up the temporary file after successful upload
        try {
            if (fs.existsSync(localfilePath)) {
                fs.unlinkSync(localfilePath);
                console.log(`Temporary file deleted: ${localfilePath}`);
            }
        } catch (unlinkError) {
            console.log(`Warning: Unable to delete temporary file ${localfilePath}`, unlinkError);
            // Don't throw error here - we still want to return the response
        }
        
        return response;

    } catch(error) {
        console.error("Error uploading to Cloudinary:", error);
        
        // Try to clean up the temporary file even if upload failed
        try {
            if (fs.existsSync(localfilePath)) {
                fs.unlinkSync(localfilePath);
                console.log(`Temporary file deleted after upload error: ${localfilePath}`);
            }
        } catch (unlinkError) {
            console.log(`Warning: Unable to delete temporary file ${localfilePath}`, unlinkError);
        }
        
        return null;
    }
}

// Export both the cloudinary instance and functions
export { cloudinary, uploadOnCloudinary, checkCloudinaryHealth, isConfigured }