const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const ProductService = require('../services/product');


router.post("/get", checkPermission, ProductService.getList);

router.post("/detail",
    checkPermission,
    ProductService.getDetail
);


module.exports = router