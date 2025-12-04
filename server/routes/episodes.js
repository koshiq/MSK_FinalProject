const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episodeController');
const auth = require('../middleware/auth');
const { isAdmin, isStaff } = require('../middleware/roleAuth');
const { episodeValidation } = require('../middleware/validators');
const { param } = require('express-validator');
const { validate } = require('../middleware/validators');

// Public routes
router.get('/series/:seriesId', 
    [param('seriesId').isInt({ min: 1 }).withMessage('Invalid series ID'), validate],
    episodeController.getEpisodesBySeries
);

router.get('/:id', 
    [param('id').isInt({ min: 1 }).withMessage('Invalid episode ID'), validate],
    episodeController.getEpisodeById
);

// Protected routes (User)
router.get('/continue/watching', auth, episodeController.getContinueWatching);
router.post('/:episodeId/:seriesId/progress', auth, episodeValidation.updateProgress, episodeController.updateWatchProgress);

// Protected routes (Admin/Employee only)
router.post('/', auth, isStaff, episodeValidation.create, episodeController.createEpisode);
router.put('/:id', auth, isStaff, episodeValidation.update, episodeController.updateEpisode);
router.delete('/:id', auth, isAdmin, episodeValidation.delete, episodeController.deleteEpisode);

module.exports = router;
