const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const OrderService = require('../services/order');


router.post("/get/amount-zalopay", checkPermission, OrderService.getAmountZaloPay);
router.post("/create/zalopay", checkPermission, OrderService.createOrderZaloPay);

// TODO VNPay
router.post("/create_payment_url", checkPermission, OrderService.createPaymentURL);
router.get("/vnpay_return", OrderService.vnpayReturn);
router.get("/vnpay_ipn", OrderService.vnpayIPN);
router.post("/querydr", OrderService.queryDR);
router.post("/refund", OrderService.refund);



module.exports = router