const router = require("express").Router();
const UserController = require("../controllers/user.controller");

// LOGIN user
router.post('/auth', UserController.login);
// CREATE user
router.post("/users/signup", UserController.create);
// UPDATE user
router.put("/users/:id", UserController.update);
// DELETE user
router.delete("/users/:id", UserController.delete);
// GET users
router.get("/users/", UserController.getUsers);
// GET user
router.get("/users/:id", UserController.getUser);

module.exports = router;