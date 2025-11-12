const multer = require('multer');
const logger = require('../utils/Logger');
const httpStatus = require('../common/HttpStatusCodes');
const errorCode = require('../common/ErroCodes');
const path = require('path');
const tokenUtils = require('../utils/TokenUtils');
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

exports.uploadMultipleDocuments = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;

  upload.array('documents')(req, res, (err) => {
    if (err) {
      logger.log("POST", "/upload/documents", currentuser, errorCode.ERR0008.title, false);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: {}, errors: [errorCode.ERR0008, err.message] });
    }
    if (!req.files) {
      logger.log("POST", "/upload/documents", currentuser, errorCode.ERR0007.title, false);
      return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0007, err.message] });
    } 
    logger.log("POST", "/upload/documents", currentuser, "Documents uploaded successfully");
    return res.status(httpStatus.OK).json({ data: { message: 'Documents uploaded successfully', filePaths: req.files.map(file => `/uploads/documents/${file.filename}`) }, errors: [] });
  });
};

exports.loadDocuments = (req, res) => {
  const currentuser = tokenUtils.decodeToken(req.headers["authorization"]).username;
  const filePath = req.query.path;
  if (!filePath) {
    logger.log("GET", "/load-document", currentuser, errorCode.ERR0007.title, false);
    return res.status(httpStatus.BAD_REQUEST).json({ data: {}, errors: [errorCode.ERR0007   , err.message]});
  }
  logger.log("GET", "/load-document", currentuser);
  res.sendFile(path.join(__dirname, filePath));
};