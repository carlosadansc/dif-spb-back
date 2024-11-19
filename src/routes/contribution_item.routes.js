const router = require("express").Router();
const ContributionItemController = require("../controllers/contribution_item.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE contribution item
router.post("/contribution-item/create", UserMiddleware.verifyUser, ContributionItemController.create);

// GET contributionsByType
router.get("/contribution-item/by-category", UserMiddleware.verifyUser, ContributionItemController.getContributionsByCategory);

module.exports = router;