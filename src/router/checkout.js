const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const CheckoutService = require('../services/checkout');


router.post("/get/product", checkPermission, CheckoutService.getProductCheckout);
router.post("/get/payment-method", checkPermission, CheckoutService.getPaymentMethod);



module.exports = router