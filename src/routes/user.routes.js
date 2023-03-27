const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// LOGIN user
router.post('/user/signin', UserController.signin);
// CREATE user
router.post("/user/signup", UserMiddleware.verifyAdmin, UserController.signup);
// UPDATE user
router.put("/user/:id", UserMiddleware.verifyAdmin, UserController.update);
// DELETE user
router.delete("/user/:id", UserMiddleware.verifyAdmin, UserController.delete);
// GET users
router.get("/users", UserMiddleware.verifyAdmin, UserController.getUsers);
// GET user
router.get("/user/:id", UserMiddleware.verifyAdmin, UserController.getUser);
// GET simple user
router.get("/user/simple/:id", UserMiddleware.verifyAdmin, UserController.getUserSimple);

module.exports = router;