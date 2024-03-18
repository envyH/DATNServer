const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { checkPermission } = require('../middlewares/middleware');

const AuthTokenService = require('../services/auth.token');


router.post("/create", 
// checkPermission, 
AuthTokenService.create);
router.post("/delete", 
// checkPermission, 
AuthTokenService.delete);


module.exports = router