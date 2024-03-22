const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');

const OverlayMessagesService = require('../services/overlay.message');


router.post("/get", checkPermission, OverlayMessagesService.getList);


module.exports = router