import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Ensure temp directory exists
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("Created temp directory for file uploads:", tempDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, tempDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with no spaces
      const sanitizedName = file.originalname.replace(/\s+/g, '_');
      const uniqueFilename = `${uuidv4()}-${sanitizedName}`;
      
      console.log("File received:", file.originalname);
      console.log("File saved as:", uniqueFilename);
      
      cb(null, uniqueFilename);
    }
  });

export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});