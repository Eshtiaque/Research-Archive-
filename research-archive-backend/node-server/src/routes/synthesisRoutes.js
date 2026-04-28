const express = require('express');
const { generateSynthesis } = require('../controllers/synthesisController');
const router = express.Router();

router.post('/', generateSynthesis);
router.post('/generate', generateSynthesis);

module.exports = router;