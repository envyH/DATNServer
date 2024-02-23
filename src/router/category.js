const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const CategoryService = require('../services/category');


router.post("/get",
    checkPermission,
    CategoryService.getList
);


module.exports = router