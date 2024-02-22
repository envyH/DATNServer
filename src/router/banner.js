const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');

const BannerService = require('../services/banner');


router.post("/get",
    checkPermission,
    BannerService.getList
);


module.exports = router