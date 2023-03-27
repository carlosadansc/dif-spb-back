const router = require("express").Router();
const EventController = require("../controllers/family.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// CREATE event
router.post("/event/create", UserMiddleware.verifyUser, EventController.create);

module.exports = router;