const router = require("express").Router();
const FamilyController = require("../controllers/family.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE family
router.post("/family/create", UserMiddleware.verifyUser, FamilyController.create);

// GET family by id
router.get("/family/by-beneficiary/:id", UserMiddleware.verifyUser, FamilyController.getFamiliesByBeneficiary);


module.exports = router;