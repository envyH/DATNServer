const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const OrderService = require('../services/order');


router.post("/get/amount-zalopay", checkPermission, OrderService.getAmountZaloPay);
router.post("/get/amount-zalopay-now", checkPermission, OrderService.getAmountZaloPayNow);
router.post("/create/zalopay", checkPermission, OrderService.createOrderZaloPay);
router.post("/create/zalopay-now", checkPermission, OrderService.createOrderZaloPayNow);

// TODO VNPay
router.post("/create_payment_url", checkPermission, OrderService.createPaymentURL);
router.get("/vnpay_return", OrderService.vnpayReturn);
router.get("/vnpay_ipn", OrderService.vnpayIPN);
router.post("/querydr", checkPermission, OrderService.queryDR);
router.post("/refund", checkPermission, OrderService.refund);


module.exports = router