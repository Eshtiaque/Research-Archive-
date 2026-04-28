const express = require('express');
const { generateChatResponse } = require('../controllers/chatController');
const router = express.Router();

router.post('/', generateChatResponse);

module.exports = router;