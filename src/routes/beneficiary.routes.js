const router = require("express").Router();
const BeneficiaryController = require("../controllers/beneficiary.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE user
router.post("/beneficiaries/create", UserMiddleware.verifyUser, BeneficiaryController.create);
router.put("/beneficiaries/update", UserMiddleware.verifyUser, BeneficiaryController.update);
router.get("/beneficiaries", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiaries);

module.exports = router;