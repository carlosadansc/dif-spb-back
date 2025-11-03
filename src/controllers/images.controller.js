const multer = require('multer');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes');
const errorCode = require('../common/ErroCodes');
const path = require('path');
const tokenUtils = require('../utils/TokenUtils');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/photos/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

exports.uploadImage = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;

  upload.single('image')(req, res, (err) => {
    if (err) {
      logger.log("POST", "/upload/image", currentuser, errorCode.ERR0008.title, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: {}, errors: [errorCode.ERR0008, err.message] });
    }
    if (!req.file) {
      logger.log("POST", "/upload/image", currentuser, errorCode.ERR0007.title, false);
      return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0007] });
    } 
    logger.log("POST", "/upload/image", currentuser, "File uploaded successfully");
    return res.status(httpStatus.OK).json({ data: { message: 'File uploaded successfully', filePath: `/uploads/photos/${req.file.filename}` }, errors: [] });
  });
};

exports.loadImage = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const filePath = req.query.path;
  if (!filePath) {
    logger.log("GET", "/load-image", currentuser, errorCode.ERR0007.title, false);
    return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0007] });
  }
  logger.log("GET", "/load-image", currentuser);
  res.sendFile(path.join(__dirname, filePath));
};

exports.deleteImage = async (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const { filePath } = req.body;
  console.log("filePath", filePath)
  
  if (!filePath) {
    logger.log("DELETE", "/image/delete", currentuser, errorCode.ERR0007.title, false);
    return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0007] });
  }
  
  // Construct the full path to the uploads directory
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads/photos/');
  const fileName = path.basename(filePath); // Get just the filename
  const fullPath = path.join(uploadsDir, fileName);
  
  try {
    // Check if file exists
    await fs.access(fullPath, fs.constants.F_OK);
    
    // Delete the file
    await fs.unlink(fullPath);
    
    logger.log("DELETE", "/image/delete", currentuser, "File deleted successfully");
    return res.status(httpStatus.OK).json({ 
      data: { message: 'File deleted successfully' }, 
      errors: [] 
    });
  } catch (error) {
    logger.log("DELETE", "/image/delete", currentuser, error.message, false);
    
    if (error.code === 'ENOENT') {
      return res.status(httpStatus.NOT_FOUND).json({ 
        data: {}, 
        errors: [{ ...errorCode.ERR0008, message: 'File not found' }] 
      });
    }
    
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ 
      data: {}, 
      errors: [{ ...errorCode.ERR0000, message: 'Error deleting file' }] 
    });
  }
};