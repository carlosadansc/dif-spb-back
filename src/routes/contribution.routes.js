const router = require("express").Router();
const ContributionController = require("../controllers/contribution.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE contribution
router.post("/contribution/create", UserMiddleware.verifyUser, ContributionController.create);

module.exports = router;