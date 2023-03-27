const router = require("express").Router();
const ContributionItemController = require("../controllers/contribution_item.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE contribution item
router.post("/contribution-item/create", UserMiddleware.verifyAdmin, ContributionItemController.create);

module.exports = router;