const express = require('express');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const CategoryController = require('../controllers/category');
const CustomerController = require('../controllers/customer');
const HomeController = require('../controllers/home');
const BannerController = require('../controllers/banner');


router.get('/', (req, res, next) => {
    const strCompress = "Hello world";
    return res.status(200).json({
        message: "Have a nice day!",
        metadata: strCompress.repeat(2)
    })
});


router.post('/category/create', upload.single('image'), CategoryController.create);
router.get('/category', CategoryController.show);
router.get('/customer', CustomerController.show);
router.get('/banner', BannerController.show);
router.get('/home', HomeController.show);


module.exports = router;