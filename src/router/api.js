const express = require('express');
const router = express.Router();


const bannerRouter = require('./banner');
const categoryRouter = require('./category');
const customerRouter = require('./customer');

router.use('/banner', bannerRouter);
router.use('/category', categoryRouter);
router.use('/customer', customerRouter);


module.exports = router;