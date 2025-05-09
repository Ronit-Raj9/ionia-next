import multer from "multer";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Define the temp directory path - using a relative path from the root
const tempDir = "./backend/public/temp";

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("Created temp directory for file uploads:", tempDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Double-check the directory exists before trying to save files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
      console.log("Re-created temp directory for file uploads:", tempDir);
    }
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

// Add a fileFilter to validate images
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});