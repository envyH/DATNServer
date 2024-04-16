const express = require('express');
const router = express.Router();


const bannerRouter = require('./banner');
const categoryRouter = require('./category');
const productRouter = require('./product');
const cartRouter = require('./cart');
const checkoutRouter = require('./checkout');
const orderRouter = require('./order');
const customerRouter = require('./customer');
const authTokenRouter = require('./auth.token');
const notificationRouter = require('./notification');
const overlayMessageRouter = require('./overlay.message');
const globalRouter = require('./global');
const messageRouter = require('./message');


router.use('/banner', bannerRouter);
router.use('/category', categoryRouter);
router.use('/product', productRouter);
router.use('/cart', cartRouter);
router.use('/checkout', checkoutRouter);
router.use('/order', orderRouter);
router.use('/customer', customerRouter);
router.use('/auth', authTokenRouter);
router.use('/notification', notificationRouter);
router.use('/overlay/message', overlayMessageRouter);
router.use('/global', globalRouter);
router.use('/message', messageRouter);


module.exports = router;