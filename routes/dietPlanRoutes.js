const express = require("express");
const router = express.Router();
const DietPlan = require("../models/dietPlanModel");

// Save a meal plan
router.post("/save-meal-plan", async (req, res) => {
    try {
        console.log("Received Meal Plan Data:", req.body); // Debugging step

        let { days, userId } = req.body;

        // Ensure 'userId' is present in the request body
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        // If 'days' is missing or not an object, wrap the request body inside 'days'
        if (!days || typeof days !== "object" || Array.isArray(days)) {
            days = { ...req.body }; // Wrap the entire request body inside 'days'
        }

        // Create a new meal plan with the userId and days
        const newPlan = new DietPlan({ days, userId });
        await newPlan.save();

        res.status(201).json({ message: "Meal plan saved successfully!", data: newPlan });
    } catch (error) {
        console.error("Error saving meal plan:", error);
        res.status(500).json({ error: "Failed to save meal plan" });
    }
});

// Fetch meal plans by userId
router.get("/meal-plans/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch meal plans for a specific userId
        const mealPlans = await DietPlan.find({ userId });

        if (mealPlans.length === 0) {
            return res.status(404).json({ error: "No meal plans found for this user" });
        }

        res.status(200).json(mealPlans);
    } catch (error) {
        console.error("Error fetching meal plans:", error);
        res.status(500).json({ error: "Failed to retrieve meal plans" });
    }
});

// Fetch a single meal plan by its ID and userId
router.get("/meal-plan/:userId/:id", async (req, res) => {
    try {
        const { userId, id } = req.params;

        // Fetch the meal plan for a specific userId and meal plan ID
        const mealPlan = await DietPlan.findOne({ _id: id, userId });

        if (!mealPlan) {
            return res.status(404).json({ error: "Meal plan not found for this user" });
        }

        res.status(200).json(mealPlan);
    } catch (error) {
        console.error("Error fetching meal plan:", error);
        res.status(500).json({ error: "Failed to retrieve meal plan" });
    }
});

module.exports = router;
