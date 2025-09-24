const router = require("express").Router();
const CategoryController = require("../controllers/category.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// GET all categories
router.get("/categories", UserMiddleware.verifyUser, CategoryController.getAllCategories);

// CREATE a category
router.post("/category/create", UserMiddleware.verifyAdmin, CategoryController.create);

// UPDATE a category
router.put("/category/update/:id", UserMiddleware.verifyAdmin, CategoryController.update);

// CREATE a product or service and add to category
router.post("/category/create-product-or-service", UserMiddleware.verifyAdmin, CategoryController.createProductOrService);

// QUIT a product or service from category
router.post("/category/quit-product-or-service", UserMiddleware.verifyAdmin, CategoryController.quitProductOrService);

module.exports = router;