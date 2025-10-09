import multer from "multer";

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

export const cloudFileUpload = ({ typeNeeded = [] }) => {
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

  const storage = multer.diskStorage({});

  return multer({
    dest: "./tmp",
    fileFilter,
    storage: storage,
  });
};
