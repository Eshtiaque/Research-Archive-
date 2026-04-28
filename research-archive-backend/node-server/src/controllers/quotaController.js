const Quota = require('../models/Quota');

const PLAN_LIMITS = {
  'Basic Scholar': { search: 20, review: 5 },
  'Pro Researcher': { search: 500, review: 50 },
  'Institutional': { search: 10000, review: 1000 }
};


const getUserQuota = async (req, res) => {
    try {
        const { clerkId } = req.params;
        
        let userQuota = await Quota.findOne({ clerkUserId: clerkId });
        
        if (!userQuota) {
            userQuota = await Quota.create({ 
                clerkUserId: clerkId,
                plan: 'Basic Scholar', 
                searchUsed: 0,         
                reviewUsed: 0
            });
        }

        const userPlan = userQuota.plan || 'Basic Scholar';
        const limits = PLAN_LIMITS[userPlan];

        const responseData = {
            ...userQuota._doc, 
            searchLimit: limits.search, 
            reviewLimit: limits.review, 
            plan: userPlan
        };
        
        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error("Quota Fetch Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


const syncUserQuota = async (req, res) => {
  try {
    const { clerkId, name, email } = req.body;

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "Clerk ID missing" });
    }

    const userQuota = await Quota.findOneAndUpdate(
      { clerkUserId: clerkId }, 
      { 
        $set: { name, email, lastLogin: Date.now() }, 
        $setOnInsert: { plan: "Basic Scholar", searchUsed: 0, reviewUsed: 0 }
      },
      { upsert: true, new: true } 
    );

    console.log("👤 User Synced:", userQuota.email);
    res.status(200).json({ success: true, data: userQuota });
  } catch (error) {
    console.error("Sync Logic Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
module.exports = {
    getUserQuota,
    syncUserQuota 
};