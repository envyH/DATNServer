const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const CategoryController = require('../controllers/category');
const ChatController = require('../controllers/chat');
const CustomerController = require('../controllers/customer');
const HomeController = require('../controllers/home');
const BannerController = require('../controllers/banner');
const LoginController = require('../controllers/login');
// const OrderController = require('../controllers/order');


router.get('/', (req, res) => {
    const strCompress = "Hello world";
    return res.status(200).json({
        message: "Have a nice day!",
        metadata: strCompress.repeat(2)
    })
});


router.post('/category/create', upload.single('image'), CategoryController.create);
router.get('/category', CategoryController.show);
router.get('/chat', ChatController.showConversation);
router.post('/chat/', ChatController.checkConversationID);
router.get('/chat/c/:conversationid', ChatController.showMessage);
router.get('/customer', CustomerController.show);
router.get('/banner', BannerController.show);
router.get('/home', HomeController.show);
router.get('/login', LoginController.show);
router.post('/do-login', LoginController.login);

module.exports = router;