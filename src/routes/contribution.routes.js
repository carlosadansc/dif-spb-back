const router = require("express").Router()
const ContributionController = require("../controllers/contribution.controller")
const UserMiddleware = require("../middlewares/UserMiddleware")

// --- POSTS ---

// CREATE contribution
router.post("/contribution/create", UserMiddleware.verifyUser, ContributionController.create)

// CREATE contribution with multiple beneficiaries
router.post("/contribution/create-multiple", UserMiddleware.verifyUser, ContributionController.createContributionsWithMultipleBeneficiaries)

// --- GETS (Static) ---

// GET all supports
router.get("/contribution/get-all", UserMiddleware.verifyUser, ContributionController.getAllContributions)

// GET massive contributions
router.get("/contribution/massive-contributions", UserMiddleware.verifyUser, ContributionController.getMassiveContributions)

// GET contribution years
router.get("/contribution/years", UserMiddleware.verifyUser, ContributionController.getContributionYears)

// GET contribution summary
router.get("/contribution/summary", UserMiddleware.verifyUser, ContributionController.getContributionSummary)

// GET contribution items summary by category
router.get("/contribution/summary-by-category", UserMiddleware.verifyUser, ContributionController.getContributionSummaryByCategory)

// GET contribution whit category
router.get("/contribution/categories", UserMiddleware.verifyUser, ContributionController.getContributionsWithCategory)

// --- GETS (Parameterized) ---

// GET contribution by beneficiary for export
router.get("/contribution/by-beneficiary/:id/export", UserMiddleware.verifyUser, ContributionController.getContributionsByBeneficiaryForExport)

// GET contribution by beneficiary
router.get("/contribution/by-beneficiary/:id", UserMiddleware.verifyUser, ContributionController.getContributionsByBeneficiary)

// GET contribution (Generic ID - Must be last)
router.get("/contribution/:id", UserMiddleware.verifyUser, ContributionController.getContribution)

module.exports = router