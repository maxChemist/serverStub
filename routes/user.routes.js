const Router = require("express");
const router = new Router();
const userController = require("../controller/user.controller");

router.get('/',userController.get)
router.get('/db',userController.db)
router.get('/brand/:id',userController.brand)
module.exports = router;
