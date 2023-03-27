const router = require("express").Router();
const BeneficiaryController = require("../controllers/beneficiary.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE beneficiary
router.post("/beneficiary/create", UserMiddleware.verifyUser, BeneficiaryController.create);

// GET beneficiary by id
router.get("/beneficiary/:id", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiaryById);

// UPDATE beneficiary
router.put("/beneficiary/update", UserMiddleware.verifyUser, BeneficiaryController.update);

// GET All beneficiaries
router.get("/beneficiaries", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiaries);

module.exports = router;