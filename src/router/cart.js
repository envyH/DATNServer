const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const CartService = require('../services/cart');


router.post("/add", checkPermission, CartService.addToCart);
router.post("/get/customer", checkPermission, CartService.getByCustomerID);
router.post("/update/quantity", checkPermission, CartService.updateQuanity);
router.post("/update/status", checkPermission, CartService.updateStatus);
router.post("/update/status-all", checkPermission, CartService.updateStatusAll);


module.exports = router