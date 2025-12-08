const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/seriesController');
const auth = require('../middleware/auth');
const { isAdmin, isStaff } = require('../middleware/roleAuth');
const { seriesValidation } = require('../middleware/validators');

// Public routes
router.get('/', seriesController.getAllSeries);
router.get('/featured', seriesController.getFeaturedSeries);
router.get('/genres', seriesController.getAllGenres);
router.get('/countries', seriesController.getAllCountries);
router.get('/search', seriesValidation.search, seriesController.searchSeries);
router.get('/genre/:genre', seriesController.getSeriesByGenre);
router.get('/:id', seriesValidation.getById, seriesController.getSeriesById);

// Protected routes (Admin/Employee only)
router.post('/', auth, isStaff, seriesValidation.create, seriesController.createSeries);
router.put('/:id', auth, isStaff, seriesValidation.update, seriesController.updateSeries);
router.delete('/:id', auth, isAdmin, seriesValidation.delete, seriesController.deleteSeries);

module.exports = router;
