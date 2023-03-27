const router = require("express").Router();
const FamilyController = require("../controllers/family.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE family
router.post("/family/create", UserMiddleware.verifyUser, FamilyController.create);
//router.put("/familiar/update", UserMiddleware.verifyUser, FamilyController.update);

module.exports = router;