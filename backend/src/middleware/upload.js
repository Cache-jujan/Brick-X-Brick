const multer = require('multer');
const path = require('path');
const fs = require('fs');
 
// Create uploads folder if it does not exist yet
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
 
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
 
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|heic/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});
 
module.exports = { upload };