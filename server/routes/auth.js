const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authValidation } = require('../middleware/validators');
const { body } = require('express-validator');
const { validate } = require('../middleware/validators');

// Public routes
router.post('/register', authValidation.register, authController.register);
router.post('/login', authValidation.login, authController.login);

// Protected routes
router.get('/me', auth, authController.getMe);

router.put('/profile', 
    auth,
    [
        body('firstName').optional().trim().isLength({ min: 2, max: 30 }),
        body('lastName').optional().trim().isLength({ max: 30 }),
        body('billingStreet').optional().trim().isLength({ max: 50 }),
        body('billingCity').optional().trim().isLength({ max: 30 }),
        body('billingZipcode').optional().isInt({ min: 0 }),
        validate
    ],
    authController.updateProfile
);

router.put('/password',
    auth,
    [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8, max: 100 }).withMessage('New password must be 8-100 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
        validate
    ],
    authController.changePassword
);

router.delete('/account', auth, authController.deleteAccount);

module.exports = router;
