const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const CategoryController = require('../controllers/category');


router.get('/', CategoryController.show);
router.post('/create', upload.single('image'), CategoryController.create);


module.exports = router