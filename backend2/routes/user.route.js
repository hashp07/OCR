const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/register', [
    body('username').notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Valid email is required'), 
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], userController.registerUser); 


router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'), 
    body('password').notEmpty().withMessage('Password is required')
], userController.loginUser);   

router.get('/me', authMiddleware, userController.getMe);
module.exports = router;

