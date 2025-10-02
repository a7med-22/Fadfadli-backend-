import fs from "fs";
import multer from "multer";
import path from "node:path";

export const localFileUpload = ({ customPath = "general" } = {}) => {
  //   let basePath = `/uploads/${customPath}`;    //when i put it here , its shared across all requests and i don't need that

  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      let basePath = `/uploads/${customPath}`;
      if (req.user?._id) {
        basePath += `/${req.user._id}`;
      }
      const fullPath = path.resolve(`./src/${basePath}`);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      console.log("file", file);
      callback(null, path.resolve(fullPath));
    },
    filename: (req, file, callback) => {
      let basePath = `/uploads/${customPath}`;

      const uniqueFileName = `${Date.now()}-${Math.random()}-${
        file.originalname
      }`;

      file.filePath = `${basePath}/${uniqueFileName}`;
      callback(null, uniqueFileName);
    },
  });

  return multer({
    dest: "./tmp",
    storage: storage,
  });
};
