const express = require('express');
const router = express.Router();


const categoryRouter = require('./category');
const customerRouter = require('./customer');

router.use('/category', categoryRouter);
router.use('/customer', customerRouter);


module.exports = router;