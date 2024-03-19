const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { checkPermission } = require('../middlewares/middleware');

const CustomerService = require('../services/customer');

router.get("/verify", CustomerService.verify);
router.post('/register', CustomerService.register);
router.post('/login', CustomerService.login);
router.post('/login/check', checkPermission, CustomerService.checkLogin);
router.post('/login/verify', CustomerService.verifyLogin);
router.post('/add/fcm/', CustomerService.addFCM);
router.post('/logout', CustomerService.logout);


module.exports = router