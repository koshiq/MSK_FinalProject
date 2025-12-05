const { body, param, query, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Custom sanitizer to strip all HTML tags
 */
const sanitizeInput = (value) => {
    if (typeof value !== 'string') return value;
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();
};

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Auth validation rules
 */
const authValidation = {
    register: [
        body('firstName')
            .trim()
            .notEmpty().withMessage('First name is required')
            .isLength({ min: 2, max: 30 }).withMessage('First name must be 2-30 characters')
            .customSanitizer(sanitizeInput),
        body('lastName')
            .optional()
            .trim()
            .isLength({ max: 30 }).withMessage('Last name must be at most 30 characters')
            .customSanitizer(sanitizeInput),
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail()
            .isLength({ max: 50 }).withMessage('Email must be at most 50 characters'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 8, max: 100 }).withMessage('Password must be 8-100 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
        body('seriesId')
            .notEmpty().withMessage('Series ID is required')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        body('countryId')
            .notEmpty().withMessage('Country ID is required')
            .isInt({ min: 1 }).withMessage('Invalid country ID'),
        body('monthlyFee')
            .optional()
            .isFloat({ min: 0.01 }).withMessage('Monthly fee must be positive'),
        validate
    ],
    login: [
        body('email')
            .trim()
            .notEmpty().withMessage('Email is required')
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('Password is required'),
        validate
    ]
};

/**
 * Series validation rules
 */
const seriesValidation = {
    create: [
        body('name')
            .trim()
            .notEmpty().withMessage('Series name is required')
            .isLength({ min: 1, max: 50 }).withMessage('Name must be 1-50 characters')
            .customSanitizer(sanitizeInput),
        body('numberOfEpisodes')
            .optional()
            .isInt({ min: 1 }).withMessage('Number of episodes must be a positive integer'),
        body('releaseDate')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('countryOfRelease')
            .trim()
            .notEmpty().withMessage('Country is required')
            .isLength({ max: 30 }).withMessage('Country must be at most 30 characters')
            .customSanitizer(sanitizeInput),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters')
            .customSanitizer(sanitizeInput),
        body('posterUrl')
            .optional()
            .trim()
            .isURL().withMessage('Invalid poster URL'),
        body('bannerUrl')
            .optional()
            .trim()
            .isURL().withMessage('Invalid banner URL'),
        body('genres')
            .optional()
            .isArray().withMessage('Genres must be an array'),
        body('genres.*')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 }).withMessage('Genre must be 1-50 characters')
            .customSanitizer(sanitizeInput),
        validate
    ],
    update: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 50 }).withMessage('Name must be 1-50 characters')
            .customSanitizer(sanitizeInput),
        body('numberOfEpisodes')
            .optional()
            .isInt({ min: 1 }).withMessage('Number of episodes must be a positive integer'),
        body('releaseDate')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('countryOfRelease')
            .optional()
            .trim()
            .isLength({ max: 30 }).withMessage('Country must be at most 30 characters')
            .customSanitizer(sanitizeInput),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters')
            .customSanitizer(sanitizeInput),
        validate
    ],
    delete: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        validate
    ],
    getById: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        validate
    ],
    search: [
        query('q')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters')
            .customSanitizer(sanitizeInput),
        validate
    ]
};

/**
 * Episode validation rules
 */
const episodeValidation = {
    create: [
        body('seriesId')
            .notEmpty().withMessage('Series ID is required')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        body('episodeNo')
            .notEmpty().withMessage('Episode number is required')
            .isInt({ min: 1 }).withMessage('Episode number must be positive'),
        body('episodeTitle')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Title must be at most 50 characters')
            .customSanitizer(sanitizeInput),
        body('durationMin')
            .optional()
            .isInt({ min: 1 }).withMessage('Duration must be positive'),
        body('videoUrl')
            .optional()
            .trim()
            .isURL().withMessage('Invalid video URL'),
        body('thumbnailUrl')
            .optional()
            .trim()
            .isURL().withMessage('Invalid thumbnail URL'),
        validate
    ],
    update: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid episode ID'),
        body('episodeNo')
            .optional()
            .isInt({ min: 1 }).withMessage('Episode number must be positive'),
        body('episodeTitle')
            .optional()
            .trim()
            .isLength({ max: 50 }).withMessage('Title must be at most 50 characters')
            .customSanitizer(sanitizeInput),
        body('durationMin')
            .optional()
            .isInt({ min: 1 }).withMessage('Duration must be positive'),
        validate
    ],
    delete: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid episode ID'),
        validate
    ],
    updateProgress: [
        param('episodeId')
            .isInt({ min: 1 }).withMessage('Invalid episode ID'),
        param('seriesId')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        body('progress')
            .notEmpty().withMessage('Progress is required')
            .isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100'),
        validate
    ]
};

/**
 * Feedback validation rules
 */
const feedbackValidation = {
    create: [
        body('seriesId')
            .notEmpty().withMessage('Series ID is required')
            .isInt({ min: 1 }).withMessage('Invalid series ID'),
        body('rating')
            .notEmpty().withMessage('Rating is required')
            .isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('text')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('Review must be at most 2000 characters')
            .customSanitizer(sanitizeInput),
        validate
    ],
    update: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid feedback ID'),
        body('rating')
            .optional()
            .isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('text')
            .optional()
            .trim()
            .isLength({ max: 2000 }).withMessage('Review must be at most 2000 characters')
            .customSanitizer(sanitizeInput),
        validate
    ],
    delete: [
        param('id')
            .isInt({ min: 1 }).withMessage('Invalid feedback ID'),
        validate
    ]
};

module.exports = {
    validate,
    sanitizeInput,
    authValidation,
    seriesValidation,
    episodeValidation,
    feedbackValidation
};

