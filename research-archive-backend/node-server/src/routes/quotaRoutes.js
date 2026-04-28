const express = require('express');
const router = express.Router();
const { getUserQuota, syncUserQuota } = require('../controllers/quotaController'); 

router.get('/quota/:clerkId', getUserQuota);


router.post('/sync', syncUserQuota);

module.exports = router;


