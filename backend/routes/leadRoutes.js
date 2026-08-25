const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// ==========================================================
// 🔥 PUBLIC ROUTE: CAPTURE LEAD FROM LANDING PAGE 🔥
// ==========================================================
router.post('/submit', async (req, res) => {
    try {
        const leadData = req.body;
        
        // Save to Database
        const newLead = await Lead.create(leadData);
        
        console.log(`[LEAD CAPTURED] New inquiry from ${newLead.institutionName} (${newLead.planType} Plan)`);
        
        res.status(201).json({ 
            message: "Demo request received successfully!", 
            lead: newLead 
        });
    } catch (error) {
        console.error("LEAD_CAPTURE_ERROR:", error);
        res.status(500).json({ message: "Failed to submit request. Please try again." });
    }
});

// ==========================================================
// 🔥 SUPERADMIN ROUTE: FETCH ALL LEADS 🔥
// ==========================================================
router.get('/all', async (req, res) => {
    try {
        // Sabse nayi lead sabse upar aayegi (createdAt: -1)
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.json(leads);
    } catch (error) {
        console.error("Fetch Leads Error:", error);
        res.status(500).json({ message: "Failed to fetch leads." });
    }
});
module.exports = router;