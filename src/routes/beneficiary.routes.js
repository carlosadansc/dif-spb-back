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

// GET beneficiary count
router.get("/beneficiaries/count", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiariesCount);

// GET check beneficiary exists by curp
router.get("/beneficiary/check-curp/:curp", UserMiddleware.verifyUser, BeneficiaryController.checkCurp);

// CREATE a family member
router.post("/beneficiary/:id/family-create", UserMiddleware.verifyUser, BeneficiaryController.createFamily);

// DELETE a family member
router.delete("/beneficiary/:beneficiaryId/family-delete/:familyId", UserMiddleware.verifyAdmin, BeneficiaryController.deleteFamily);

// GET beneficiary family members
router.get("/beneficiary/:id/family", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiaryFamily);

// GET beneficiary family members
router.get("/beneficiary/:id/family-names", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiaryFamilyNames);

// GET generar CURP provisional
router.get("/generate-curp", UserMiddleware.verifyUser, BeneficiaryController.generateCurp);

// GET delegaciones y número total de beneficiarios
router.get("/beneficiaries/by-delegations", UserMiddleware.verifyUser, BeneficiaryController.getDelegationsAndBeneficiaries);

// GET beneficiarios por sexo
router.get("/beneficiaries/by-sex", UserMiddleware.verifyUser, BeneficiaryController.getBeneficiariesBySex);

// DELETE beneficiary and related data
router.delete("/beneficiary/delete/:id", UserMiddleware.verifyAdmin, BeneficiaryController.deleteBeneficiaryWithAllRelatedData);

module.exports = router;