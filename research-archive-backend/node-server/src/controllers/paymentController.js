const Quota = require('../models/Quota');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const { clerkId, planName, price } = req.body;

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173'; 

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Research Archive - ${planName} Plan`,
              description: "Unlock advanced AI features and unlimited quota.",
            },
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendURL}/dashboard?payment=success&clerkId=${clerkId}&plan=${planName}`,
      cancel_url: `${frontendURL}/pricing?payment=cancelled`,
    });

    res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Stripe Error:", error.message);
    res.status(500).json({ success: false, message: "Payment session failed" });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { clerkId, planName } = req.body;

    const updatedUser = await Quota.findOneAndUpdate(
      { clerkUserId: clerkId },
      { 
        $set: { 
          plan: planName,
          searchLimit: 500,
          reviewLimit: 50   
        } 
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Upgrade Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update subscription" });
  }
};

module.exports = { createCheckoutSession, updateSubscription };