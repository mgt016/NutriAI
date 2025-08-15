const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

router.post('/register', async (req, res) => {
    try {
        const {
            name, phoneNumber, password, email, dateOfBirth
        } = req.body;

        if (!name || !email || !phoneNumber || !password || !dateOfBirth ) {
            return res.status(400).json({ status: false, msg: "All fields are required" });
        }

        // Check if email already exists
        const emailCheck = await userModel.findOne({ email });
        if (emailCheck) {
            return res.status(400).json({ status: false, msg: "Email already exists" });
        }

        // Check if phone number already exists
        const phoneCheck = await userModel.findOne({ phoneNumber });
        if (phoneCheck) {
            return res.status(400).json({ status: false, msg: "Phone number already exists" });
        }

        // Hash password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new userModel({
            name,
            email,
            phoneNumber,
            password: encryptedPassword,
            dateOfBirth,
            role: "User",
            status: "Active"
        });

        await newUser.save();

        res.status(201).json({ status: true, msg: "User registered successfully", user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, msg: "Internal server error" });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ status: false, msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, msg: 'Invalid credentials' });
        }

        res.json({ status: true, msg: 'Login successful', userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, msg: 'Server error' });
    }
});

router.post('/user/update', async (req, res) => {
    try {
        const {  name, phoneNumber, password, email, dateOfBirth, weight, height,
            gender, activityLevel, goal } = req.body;

        if (!email) {
            return res.status(400).json({ status: false, msg: "Email is required to update the record" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        if (name) user.name = name;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (password) user.password = await bcrypt.hash(password, 10);
        if (dateOfBirth) user.dateOfBirth=dateOfBirth;
        if (weight) user.weight=weight;
        if (height) user.height=height;
        if (activityLevel) user.activityLevel=activityLevel;
        if (goal) user.goal=goal;
        if (gender) user.gender =gender;


        await user.save();

        res.status(200).json({ status: true, msg: "User details updated", user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, msg: "Internal server error" });
    }
});

router.get('/user/profile/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        return res.status(200).json({ status: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, msg: "Internal server error" });
    }
});




// Endpoint to update password
router.post('/user/updatepassword', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        // Validate input
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ status: false, msg: "All fields are required." });
        }

        // Find the user by ID
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        // Compare the current password with the stored password (hashed)
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, msg: "Current password is incorrect." });
        }

        // Hash the new password before saving
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Save the updated user document
        await user.save();

        return res.status(200).json({ status: true, msg: "Password updated successfully!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, msg: "Internal server error." });
    }
});





router.get('/user/profileget/:id', async (req, res) => {
    try {
        let id = req.params.id.trim(); 
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ status: false, msg: "Invalid user ID format" });
        }

        // Fetch user
        const user = await userModel.findById(id);

        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        return res.status(200).json({ status: true, data: user });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: false, msg: "Internal server error" });
    }
});




router.delete('/user/delete/:id', async (req, res) => {
    try {
        const user = await userModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ status: false, msg: "User not found" });
        }

        await userModel.deleteOne({ _id: user._id });
        return res.status(200).json({ status: true, msg: "User was deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: false, msg: "Internal server error" });
    }
});

module.exports = router;
