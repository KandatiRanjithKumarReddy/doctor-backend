import multer from "multer";
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({
  filename: function (req, file, callback) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    callback(null, safeName);
  }
});

const fileFilter = (req, file, callback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = /\.(jpg|jpeg|png|webp)$/i;

  if (allowedMimeTypes.includes(file.mimetype) && allowedExts.test(path.extname(file.originalname))) {
    callback(null, true);
  } else {
    callback(new Error('Only JPG, PNG, and WebP images are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB maximum
  fileFilter,
});

export default upload;
