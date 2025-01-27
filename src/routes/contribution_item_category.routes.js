const router = require("express").Router();
const ContributionItemCategoriesController = require("../controllers/contribution_item_category.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// GET all categories
router.get("/contribution-item-categories", UserMiddleware.verifyUser, ContributionItemCategoriesController.getAllCategories);

module.exports = router;