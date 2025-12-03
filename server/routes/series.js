const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/seriesController');

router.get('/', seriesController.getAllSeries);
router.get('/featured', seriesController.getFeaturedSeries);
router.get('/search', seriesController.searchSeries);
router.get('/genre/:genre', seriesController.getSeriesByGenre);
router.get('/:id', seriesController.getSeriesById);

module.exports = router;
