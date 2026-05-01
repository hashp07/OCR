const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

module.exports.registerUser = async (req, res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

   const { username, email, password } = req.body;
   const hashedPassword = await userModel.hashPassword(password);

   const user = await userService.createUser({ username, email, password: hashedPassword });


   const token = user.generateAuthToken();
    res.status(201).json({ token,user });
}

module.exports.loginUser = async (req, res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    

    const token = user.generateAuthToken();
    res.status(200).json({ token,user });
}

module.exports.getMe = async (req, res) => {
    try {
        // ✅ FIX: Look for _id first, fallback to id just in case!
        const userId = req.user._id || req.user.id; 

        const user = await userModel.findById(userId).select('username email');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch user', error: error.message });
    }
};