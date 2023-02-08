const router = require("express").Router();
const UserController = require("../controllers/user.controller");

// LOGIN user
router.post('/users/signin', UserController.signin);
// CREATE user
router.post("/users/signup", UserController.signup);
// UPDATE user
router.put("/users/:id", UserController.update);
// DELETE user
router.delete("/users/:id", UserController.delete);
// GET users
router.get("/users/", UserController.getUsers);
// GET user
router.get("/users/:id", UserController.getUser);

module.exports = router;