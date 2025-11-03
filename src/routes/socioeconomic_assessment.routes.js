const router = require("express").Router();
const SocioeconomicAssessmentController = require("../controllers/socioeconomic_assessment.controller");
const UserMiddleware = require("../middlewares/UserMiddleware");

// CREATE socioeconomic assessment for a beneficiary
router.post(
  "/socioeconomic-assessment/:beneficiaryId/create",
  UserMiddleware.verifyUser,
  SocioeconomicAssessmentController.create
);

// GET all assessments for a beneficiary
router.get(
  "/socioeconomic-assessment/beneficiary/:beneficiaryId",
  UserMiddleware.verifyUser,
  SocioeconomicAssessmentController.getByBeneficiary
);

// GET latest assessment for a beneficiary
router.get(
  "/socioeconomic-assessment/latest/:beneficiaryId",
  UserMiddleware.verifyUser,
  SocioeconomicAssessmentController.getLatest
);

// GET single assessment by ID
router.get(
  "/socioeconomic-assessment/:id",
  UserMiddleware.verifyUser,
  SocioeconomicAssessmentController.getById
);

// UPDATE assessment (notes and type only)
router.put(
  "/socioeconomic-assessment/update/:id",
  UserMiddleware.verifyUser,
  SocioeconomicAssessmentController.update
);

// DELETE assessment (soft delete)
router.delete(
  "/socioeconomic-assessment/delete/:id",
  UserMiddleware.verifyAdmin,
  SocioeconomicAssessmentController.delete
);

// COMPARE two assessments
router.get(
  "/socioeconomic-assessment/compare/:id1/:id2",
  UserMiddleware.verifyUser,
  SocioeconomicAssessmentController.compare
);

module.exports = router;
