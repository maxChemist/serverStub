const Router = require("express");
const router = new Router();
const userController = require("../controller/user.controller");

router.get('/',userController.get)
router.get('/db',userController.db)
router.get('/brand/:id/:page',userController.brand)
router.get('/brand/:id',userController.brand)
router.get('/structure/:id',userController.structure)
router.get('/getRecomendedArticles',userController.getRecomendedArticles)
router.get('/logbook/:brand',userController.articles)
router.get('/logbook/:brand/:id',userController.articles)
router.get('/article/:id',userController.oneArticle)

module.exports = router;
