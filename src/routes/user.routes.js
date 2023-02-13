const router = require("express").Router();
const UserController = require("../controllers/user.controller");
const UserMiddleware = require("../middlewares/UserMiddleware")

// LOGIN user
router.post('/users/signin', UserController.signin);
// CREATE user
router.post("/users/signup", UserMiddleware.verifyAdmin, UserController.signup);
// UPDATE user
router.put("/users/:id", UserMiddleware.verifyAdmin, UserController.update);
// DELETE user
router.delete("/users/:id", UserMiddleware.verifyAdmin, UserController.delete);
// GET users
router.get("/users/", UserMiddleware.verifyAdmin, UserController.getUsers);
// GET user
router.get("/users/:id", UserMiddleware.verifyAdmin, UserController.getUser);

module.exports = router;