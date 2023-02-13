const router = require("express").Router();
const FamilyController = require("../controllers/family.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE user
router.post("/familiar/create", UserMiddleware.verifyUser, FamilyController.create);
//router.put("/familiar/update", UserMiddleware.verifyUser, FamilyController.update);

module.exports = router;