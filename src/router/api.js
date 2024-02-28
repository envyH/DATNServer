const express = require('express');
const router = express.Router();


const bannerRouter = require('./banner');
const categoryRouter = require('./category');
const productRouter = require('./product');
const cartRouter = require('./cart');
const checkoutRouter = require('./checkout');
const orderRouter = require('./order');
const customerRouter = require('./customer');

router.use('/banner', bannerRouter);
router.use('/category', categoryRouter);
router.use('/product', productRouter);
router.use('/cart', cartRouter);
router.use('/checkout', checkoutRouter);
router.use('/order', orderRouter);
router.use('/customer', customerRouter);


module.exports = router;