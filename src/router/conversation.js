const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');

const ConversationService = require('../services/conversation');


router.post("/create", checkPermission, ConversationService.create);
router.post("/get", checkPermission, ConversationService.getList);


module.exports = router