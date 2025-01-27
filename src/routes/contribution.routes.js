const router = require("express").Router()
const ContributionController = require("../controllers/contribution.controller")
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE contribution
router.post("/contribution/create", UserMiddleware.verifyUser, ContributionController.create)

// GET contribution whit category
router.get("/contribution/categories", UserMiddleware.verifyUser, ContributionController.getContributionsWithCategory)

// GET contribution years
router.get("/contribution/years", UserMiddleware.verifyUser, ContributionController.getContributionYears)

//GET contribution summary
router.get("/contribution/summary-by-category", UserMiddleware.verifyUser, ContributionController.getContributionSummaryByCategory)

//GET contribution items summary by category
router.get("/contribution/contribution-item-summary-by-category", UserMiddleware.verifyUser, ContributionController.getContributionItemSummaryByCategory)

module.exports = router