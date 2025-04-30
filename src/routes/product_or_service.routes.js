const router = require("express").Router();
const ProductOrServiceController = require("../controllers/product_or_service.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE contribution item
router.post("/product-or-service/create", UserMiddleware.verifyUser, ProductOrServiceController.create);

// GET contributionsByType
router.get("/product-or-service/by-category", UserMiddleware.verifyUser, ProductOrServiceController.getByCategory);

module.exports = router;