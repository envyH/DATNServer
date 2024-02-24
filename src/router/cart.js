const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const CartService = require('../services/cart');


router.post("/add",
    checkPermission,
    CartService.addToCart
);


module.exports = router