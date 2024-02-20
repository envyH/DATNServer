const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const CustomerController = require('../controllers/customer');

router.get("/verify", CustomerController.verify);
router.post('/register', CustomerController.register);
router.post('/login', CustomerController.login);
router.post('/login/verify', CustomerController.verifyLogin);


module.exports = router