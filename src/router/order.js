const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const OrderService = require('../services/order');


router.post("/get/amount-zalopay", checkPermission, OrderService.getAmountZaloPay);
router.post("/create/zalopay", checkPermission, OrderService.createOrderZaloPay);



module.exports = router