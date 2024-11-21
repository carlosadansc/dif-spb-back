const router = require("express").Router();
const ContributionController = require("../controllers/contribution.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE contribution
router.post("/contribution/create", UserMiddleware.verifyUser, ContributionController.create);

// GET contribution whit category
router.get("/contribution/categories", UserMiddleware.verifyUser, ContributionController.getContributionsWhitCategory);

module.exports = router;