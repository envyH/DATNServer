const express = require('express');
const route = express.Router();

const categoryRouter = require('./category');
const customerRouter = require('./customer');

route.use('/v1/api/category', categoryRouter);
route.use('/v1/api/customer', customerRouter);

route.get('/', (req, res, next) => {
    const strCompress = "Hello world";
    return res.status(200).json({
        message: "Have a nice day!",
        metadata: strCompress.repeat(2)
    })
});

module.exports = route;