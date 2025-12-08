const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
    // Register new viewer
    register: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { firstName, lastName, email, password, seriesId, countryId, monthlyFee } = req.body;

            // Validate required fields
            if (!seriesId || !countryId) {
                await connection.rollback();
                return res.status(400).json({ error: 'Series ID and Country ID are required' });
            }

            // Check if user exists
            const [existing] = await connection.query(
                'SELECT VIEWER_ID FROM MSK_VIEWER WHERE EMAIL = ?', 
                [email]
            );
            
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Validate series exists
            const [series] = await connection.query(
                'SELECT SERIES_ID FROM MSK_WEB_SERIES WHERE SERIES_ID = ?',
                [seriesId]
            );
            if (series.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Invalid series ID' });
            }

            // Validate country exists
            const [country] = await connection.query(
                'SELECT COUNTRY_ID FROM MSK_COUNTRY WHERE COUNTRY_ID = ?',
                [countryId]
            );
            if (country.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Invalid country ID' });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

            // Insert new viewer (default role is 'customer')
            const [result] = await connection.query(
                `INSERT INTO MSK_VIEWER (FIRST_NAME, LAST_NAME, EMAIL, PASSWORD_HASH, ROLE, SERIES_ID, COUNTRY_ID, MONTHLY_FEE)
                 VALUES (?, ?, ?, ?, 'customer', ?, ?, ?)`,
                [firstName, lastName || null, email, passwordHash, seriesId, countryId, monthlyFee || 14.99]
            );

            await connection.commit();

            // Generate token
            const token = jwt.sign(
                { viewerId: result.insertId, email, role: 'customer' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                viewer: {
                    id: result.insertId,
                    firstName,
                    lastName: lastName || null,
                    email,
                    role: 'customer'
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Register error:', error);
            res.status(500).json({ error: 'Registration failed' });
        } finally {
            connection.release();
        }
    },

    // Login viewer
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find viewer
            const [viewers] = await db.query(
                'SELECT VIEWER_ID, FIRST_NAME, LAST_NAME, EMAIL, PASSWORD_HASH, ROLE FROM MSK_VIEWER WHERE EMAIL = ?', 
                [email]
            );

            if (viewers.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const viewer = viewers[0];

            // Check password
            const isMatch = await bcrypt.compare(password, viewer.PASSWORD_HASH);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Generate token with role
            const token = jwt.sign(
                { 
                    viewerId: viewer.VIEWER_ID, 
                    email: viewer.EMAIL,
                    role: viewer.ROLE || 'customer'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                viewer: {
                    id: viewer.VIEWER_ID,
                    firstName: viewer.FIRST_NAME,
                    lastName: viewer.LAST_NAME,
                    email: viewer.EMAIL,
                    role: viewer.ROLE || 'customer'
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
                `SELECT VIEWER_ID, FIRST_NAME, LAST_NAME, EMAIL, ROLE, MONTHLY_FEE, CREATED_AT 
                 FROM MSK_VIEWER WHERE VIEWER_ID = ?`,
                [req.viewer.viewerId]
            );

            if (viewers.length === 0) {
                return res.status(404).json({ error: 'Viewer not found' });
            }

            const viewer = viewers[0];
            res.json({
                id: viewer.VIEWER_ID,
                firstName: viewer.FIRST_NAME,
                lastName: viewer.LAST_NAME,
                email: viewer.EMAIL,
                role: viewer.ROLE || 'customer',
                monthlyFee: viewer.MONTHLY_FEE,
                createdAt: viewer.CREATED_AT
            });
        } catch (error) {
            console.error('Get me error:', error);
            res.status(500).json({ error: 'Failed to get viewer data' });
        }
    },

    // Update viewer profile
    updateProfile: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { firstName, lastName, billingStreet, billingCity, billingZipcode } = req.body;
            const viewerId = req.viewer.viewerId;

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (firstName !== undefined) {
                updates.push('FIRST_NAME = ?');
                values.push(firstName);
            }
            if (lastName !== undefined) {
                updates.push('LAST_NAME = ?');
                values.push(lastName);
            }
            if (billingStreet !== undefined) {
                updates.push('BILLING_STREET = ?');
                values.push(billingStreet);
            }
            if (billingCity !== undefined) {
                updates.push('BILLING_CITY = ?');
                values.push(billingCity);
            }
            if (billingZipcode !== undefined) {
                updates.push('BILLING_ZIPCODE = ?');
                values.push(billingZipcode);
            }

            if (updates.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(viewerId);

            await connection.query(
                `UPDATE MSK_VIEWER SET ${updates.join(', ')} WHERE VIEWER_ID = ?`,
                values
            );

            await connection.commit();

            res.json({ message: 'Profile updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        } finally {
            connection.release();
        }
    },

    // Change password
    changePassword: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { currentPassword, newPassword } = req.body;
            const viewerId = req.viewer.viewerId;

            // Get current password hash
            const [viewers] = await connection.query(
                'SELECT PASSWORD_HASH FROM MSK_VIEWER WHERE VIEWER_ID = ?',
                [viewerId]
            );

            if (viewers.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, viewers[0].PASSWORD_HASH);
            if (!isMatch) {
                await connection.rollback();
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const newHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

            // Update password
            await connection.query(
                'UPDATE MSK_VIEWER SET PASSWORD_HASH = ? WHERE VIEWER_ID = ?',
                [newHash, viewerId]
            );

            await connection.commit();

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        } finally {
            connection.release();
        }
    },

    // Delete account (soft delete or full delete)
    deleteAccount: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const viewerId = req.viewer.viewerId;

            // Delete watch history first (due to foreign key)
            await connection.query(
                'DELETE FROM MSK_WATCH_HISTORY WHERE VIEWER_ID = ?',
                [viewerId]
            );

            // Delete feedback
            await connection.query(
                'DELETE FROM MSK_FEEDBACK WHERE VIEWER_ID = ?',
                [viewerId]
            );

            // Delete viewer
            await connection.query(
                'DELETE FROM MSK_VIEWER WHERE VIEWER_ID = ?',
                [viewerId]
            );

            await connection.commit();

            res.json({ message: 'Account deleted successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Delete account error:', error);
            res.status(500).json({ error: 'Failed to delete account' });
        } finally {
            connection.release();
        }
    }
};

module.exports = authController;
