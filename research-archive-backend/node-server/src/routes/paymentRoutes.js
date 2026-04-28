const express = require('express');
const router = express.Router();
const { createCheckoutSession, updateSubscription } = require('../controllers/paymentController');

router.post('/create-checkout-session', createCheckoutSession);
router.post('/update-subscription', updateSubscription);

module.exports = router;