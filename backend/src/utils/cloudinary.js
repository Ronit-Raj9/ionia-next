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
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: 'auto',
        })

        // file has beend uploaded successfully
        // console.log(" File is uploaded on cloudinary ", response.url );

        try {
            // Safely try to delete the temporary file
            if (fs.existsSync(localfilePath)) {
                fs.unlinkSync(localfilePath);
            }
        } catch (unlinkError) {
            console.log(`Warning: Unable to delete temporary file ${localfilePath}`, unlinkError);
            // Don't throw error here - we still want to return the response
        }
        
        return response;

    } catch(error) {
        // Only try to delete if the file exists
        try {
            if (fs.existsSync(localfilePath)) {
                fs.unlinkSync(localfilePath); // remove the locally saved temporary file file as the upload operation got failed
            }
        } catch (unlinkError) {
            console.log(`Warning: Unable to delete temporary file ${localfilePath}`, unlinkError);
        }
        
        return null;
    }
}


export {uploadOnCloudinary}