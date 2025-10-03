import fs from "fs";
import multer from "multer";
import path from "node:path";

export const fileTypes = {
  image: ["image/jpeg", "image/gif", "image/png", "image/webp"],
  document: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  video: ["video/mp4", "video/mpeg", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav"],
};

export const localFileUpload = ({
  customPath = "general",
  typeNeeded = [],
  maxFileSize = 5 * 1024 * 1024, // Default 5MB
} = {}) => {
  //   let basePath = `/uploads/${customPath}`;    //when i put it here , its shared across all requests and i don't need that

  const fileFilter = (req, file, callback) => {
    if (typeNeeded.length === 0 || typeNeeded.includes(file.mimetype)) {
      return callback(null, true);
    }

    return callback(
      new Error("Invalid file type format", { cause: 400 }),
      false
    );
  };

  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      // Create basePath logic once and store it on req for reuse
      let basePath = `/uploads/${customPath}`;
      if (req.user?._id) {
        basePath += `/${req.user._id}`;
      }

      // Store basePath on req for filename function to use
      req.basePath = basePath;

      const fullPath = path.resolve(`./src/${basePath}`);

      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }

      callback(null, path.resolve(fullPath));
    },

    filename: (req, file, callback) => {
      // Use the basePath calculated in destination
      const basePath = req.basePath;

      const uniqueFileName = `${Date.now()}-${Math.random()}-${
        file.originalname
      }`;

      // Store the complete file path for database storage
      file.filePath = `${basePath}/${uniqueFileName}`;
      callback(null, uniqueFileName);
    },
  });

  return multer({
    dest: "./tmp",
    fileFilter,
    storage: storage,
  });
};
