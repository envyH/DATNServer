const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');

const MessageService = require('../services/message');


router.post("/create", checkPermission, MessageService.addMessage);
router.post("/get", checkPermission, MessageService.get);


module.exports = router