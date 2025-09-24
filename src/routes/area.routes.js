const router = require("express").Router();
const AreaController = require("../controllers/area.controller");
const UserMiddleware = require("../middlewares/UserMiddleware");

// GET all areas
router.get("/areas", UserMiddleware.verifyAdmin, AreaController.getAll);

// CREATE area
router.post("/area/create", UserMiddleware.verifyAdmin, AreaController.create);


// UPDATE area
router.put("/area/update/:id", UserMiddleware.verifyAdmin, AreaController.update);

// DELETE area
router.delete("/area/delete/:id", UserMiddleware.verifyAdmin, AreaController.delete);

module.exports = router;