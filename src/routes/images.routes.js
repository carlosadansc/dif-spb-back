const router = require('express').Router();
const ImageController = require('../controllers/images.controller');
const UserMiddleware = require('../middlewares/UserMiddleware');

router.post('/image/upload', UserMiddleware.verifyUser, ImageController.uploadImage);
router.get('/image/load', UserMiddleware.verifyUser, ImageController.loadImage);
router.delete('/image/delete', UserMiddleware.verifyUser, ImageController.deleteImage);

module.exports = router;
