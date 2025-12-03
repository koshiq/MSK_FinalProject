const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
    // Register new viewer
    register: async (req, res) => {
        try {
            const { firstName, lastName, email, password, seriesId, countryId, monthlyFee } = req.body;

            // Check if user exists
            const [existing] = await db.query('SELECT * FROM MSK_VIEWER WHERE EMAIL = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

            // Insert new viewer
            const [result] = await db.query(
                `INSERT INTO MSK_VIEWER (FIRST_NAME, LAST_NAME, EMAIL, PASSWORD_HASH, SERIES_ID, COUNTRY_ID, MONTHLY_FEE)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [firstName, lastName, email, passwordHash, seriesId || 1, countryId || 1, monthlyFee || 14.99]
            );

            // Generate token
            const token = jwt.sign(
                { viewerId: result.insertId, email },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                viewer: {
                    id: result.insertId,
                    firstName,
                    lastName,
                    email
                }
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },

    // Login viewer
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find viewer
            const [viewers] = await db.query('SELECT * FROM MSK_VIEWER WHERE EMAIL = ?', [email]);

            if (viewers.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const viewer = viewers[0];

            // Check password
            const isMatch = await bcrypt.compare(password, viewer.PASSWORD_HASH);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign(
                { viewerId: viewer.VIEWER_ID, email: viewer.EMAIL },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE }
            );

            res.json({
                message: 'Login successful',
                token,
                viewer: {
                    id: viewer.VIEWER_ID,
                    firstName: viewer.FIRST_NAME,
                    lastName: viewer.LAST_NAME,
                    email: viewer.EMAIL
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    // Get current viewer
    getMe: async (req, res) => {
        try {
            const [viewers] = await db.query(
                'SELECT VIEWER_ID, FIRST_NAME, LAST_NAME, EMAIL, MONTHLY_FEE FROM MSK_VIEWER WHERE VIEWER_ID = ?',
                [req.viewer.viewerId]
            );

            if (viewers.length === 0) {
                return res.status(404).json({ error: 'Viewer not found' });
            }

            res.json(viewers[0]);
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({ error: 'Failed to get viewer data' });
        }
    }
};

module.exports = authController;
