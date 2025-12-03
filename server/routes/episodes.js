const express = require('express');
const router = express.Router();
const episodeController = require('../controllers/episodeController');
const auth = require('../middleware/auth');

router.get('/:id', episodeController.getEpisodeById);
router.get('/series/:seriesId', episodeController.getEpisodesBySeries);
router.post('/:episodeId/:seriesId/progress', auth, episodeController.updateWatchProgress);
router.get('/continue/watching', auth, episodeController.getContinueWatching);

module.exports = router;
