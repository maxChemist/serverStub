const Router = require("express");
const router = new Router();
const userController = require("../controller/user.controller");
const authMiddleware = require("../middleweare/authMiddleware")

router.get('/',userController.get)
router.get('/db',userController.db)
router.get('/brand/:id/:page',userController.brand)
router.get('/brand/:id',userController.brand)
router.get('/structure/:id',userController.structure)
router.get('/getRecomendedArticles',userController.getRecomendedArticles)
router.post('/createComments',userController.createComments)
router.post('/createAnswer',userController.createAnswer)
router.get('/logbook/:brand',userController.articles)
router.get('/logbook/:brand/:id',userController.articles)
router.get('/article/:id',userController.oneArticle)
router.get('/getComments',userController.getComments)
router.get('/getUser/:id',userController.getUser)
router.get('/getUserCommunities',userController.getUserCommunities)
router.get('/getRecomendedCommunities',userController.getRecomendedCommunities)
router.get('/getNewCommunities',userController.getNewCommunities)
router.get('/getCommunityPage/:id',userController.getCommunityPage)
router.get('/getCommunityBlogs/:id',userController.getCommunityBlogs)
router.get('/getCommunityForums/:id',userController.getCommunityForums)
router.get('/getCommunityMembers/:id',userController.getCommunityMembers)
router.post('/sendArticle',userController.sendArticle)
router.get('/getText',userController.getText)
router.get('/getAdvertising',userController.getAdvertising)
router.get('/subscribe/:aim',userController.subscribe)
router.get('/logBooksLine/',userController.logBooksLine)
router.get('/logBooksLine/:brand',userController.logBooksLine)
router.get('/logBooksLine/:brand/:model',userController.logBooksLine)
router.get('/logBooksLine/:brand/:model/:generation',userController.logBooksLine)
router.get('/enterManor', userController.enterManor)
router.get('/getUserProfile/:id', userController.getUserProfile)
router.post('/updateUserProfile', authMiddleware, userController.updateUserProfile)

module.exports = router;
