const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');
const NotificationService = require('../services/notification');


router.post("/create", checkPermission, NotificationService.createNotification2);


module.exports = router