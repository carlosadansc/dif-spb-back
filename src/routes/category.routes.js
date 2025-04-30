const router = require("express").Router();
const CategoryController = require("../controllers/category.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// GET all categories
router.get("/categories", UserMiddleware.verifyUser, CategoryController.getAllCategories);

// CREATE a category
router.post("/category/create", UserMiddleware.verifyAdmin, CategoryController.create);

// CREATE a product or service and add to category
router.post("/category/create-product-or-service", UserMiddleware.verifyAdmin, CategoryController.createProductOrService);

module.exports = router;