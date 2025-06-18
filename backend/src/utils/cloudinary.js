import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localfilePath) => {
    try {
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


export {uploadOnCloudinary}