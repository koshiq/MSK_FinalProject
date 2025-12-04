const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const { feedbackValidation } = require('../middleware/validators');
const { param } = require('express-validator');
const { validate } = require('../middleware/validators');

// Public routes
router.get('/series/:seriesId', 
    [param('seriesId').isInt({ min: 1 }).withMessage('Invalid series ID'), validate],
    feedbackController.getFeedbackBySeries
);

// Protected routes (User)
router.post('/', auth, feedbackValidation.create, feedbackController.addFeedback);
router.get('/my', auth, feedbackController.getMyFeedback);

router.get('/:id',
    [param('id').isInt({ min: 1 }).withMessage('Invalid feedback ID'), validate],
    feedbackController.getFeedbackById
);

// Update and delete (Owner or Admin)
router.put('/:id', auth, feedbackValidation.update, feedbackController.updateFeedback);
router.delete('/:id', auth, feedbackValidation.delete, feedbackController.deleteFeedback);

// Admin only routes
router.get('/', auth, isAdmin, feedbackController.getAllFeedback);

module.exports = router;
