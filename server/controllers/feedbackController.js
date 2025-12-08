const db = require('../config/database');

const feedbackController = {
    // Add feedback
    addFeedback: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { seriesId, rating, text } = req.body;
            const viewerId = req.viewer.viewerId;

            // Check if series exists
            const [series] = await connection.query(
                'SELECT SERIES_ID FROM MSK_WEB_SERIES WHERE SERIES_ID = ?',
                [seriesId]
            );

            if (series.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Series not found' });
            }

            // Check if user already reviewed this series
            const [existing] = await connection.query(
                'SELECT FEEDBACK_ID FROM MSK_FEEDBACK WHERE VIEWER_ID = ? AND SERIES_ID = ?',
                [viewerId, seriesId]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    error: 'You have already reviewed this series. Please update your existing review instead.',
                    existingFeedbackId: existing[0].FEEDBACK_ID
                });
            }

            const [result] = await connection.query(`
                INSERT INTO MSK_FEEDBACK (VIEWER_ID, SERIES_ID, RATING, DATE, TEXT)
                VALUES (?, ?, ?, CURDATE(), ?)
            `, [viewerId, seriesId, rating, text || null]);

            await connection.commit();

            res.status(201).json({
                message: 'Feedback added successfully',
                feedbackId: result.insertId
            });
        } catch (error) {
            await connection.rollback();
            console.error('Add feedback error:', error);
            res.status(500).json({ error: 'Failed to add feedback' });
        } finally {
            connection.release();
        }
    },

    // Update feedback (Owner or Admin only)
    updateFeedback: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { rating, text } = req.body;
            const viewerId = req.viewer.viewerId;
            const userRole = req.viewer.role;

            // Check if feedback exists and get owner
            const [existing] = await connection.query(
                'SELECT FEEDBACK_ID, VIEWER_ID FROM MSK_FEEDBACK WHERE FEEDBACK_ID = ?',
                [id]
            );

            if (existing.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Feedback not found' });
            }

            // Check ownership or admin
            if (existing[0].VIEWER_ID !== viewerId && userRole !== 'admin') {
                await connection.rollback();
                return res.status(403).json({ error: 'You can only edit your own reviews' });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (rating !== undefined) {
                updates.push('RATING = ?');
                values.push(rating);
            }
            if (text !== undefined) {
                updates.push('TEXT = ?');
                values.push(text);
            }

            // Always update the date
            updates.push('DATE = CURDATE()');

            if (updates.length === 1) { // Only date update
                await connection.rollback();
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(id);

            await connection.query(
                `UPDATE MSK_FEEDBACK SET ${updates.join(', ')} WHERE FEEDBACK_ID = ?`,
                values
            );

            await connection.commit();

            res.json({ message: 'Feedback updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Update feedback error:', error);
            res.status(500).json({ error: 'Failed to update feedback' });
        } finally {
            connection.release();
        }
    },

    // Delete feedback (Owner or Admin only)
    deleteFeedback: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const viewerId = req.viewer.viewerId;
            const userRole = req.viewer.role;

            // Check if feedback exists and get owner
            const [existing] = await connection.query(
                'SELECT FEEDBACK_ID, VIEWER_ID FROM MSK_FEEDBACK WHERE FEEDBACK_ID = ?',
                [id]
            );

            if (existing.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Feedback not found' });
            }

            // Check ownership or admin
            if (existing[0].VIEWER_ID !== viewerId && userRole !== 'admin') {
                await connection.rollback();
                return res.status(403).json({ error: 'You can only delete your own reviews' });
            }

            await connection.query(
                'DELETE FROM MSK_FEEDBACK WHERE FEEDBACK_ID = ?',
                [id]
            );

            await connection.commit();

            res.json({ message: 'Feedback deleted successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Delete feedback error:', error);
            res.status(500).json({ error: 'Failed to delete feedback' });
        } finally {
            connection.release();
        }
    },

    // Get feedback by ID
    getFeedbackById: async (req, res) => {
        try {
            const { id } = req.params;

            const [feedback] = await db.query(`
                SELECT
                    f.*,
                    v.FIRST_NAME,
                    v.LAST_NAME,
                    s.NAME as seriesName
                FROM MSK_FEEDBACK f
                JOIN MSK_VIEWER v ON f.VIEWER_ID = v.VIEWER_ID
                JOIN MSK_WEB_SERIES s ON f.SERIES_ID = s.SERIES_ID
                WHERE f.FEEDBACK_ID = ?
            `, [id]);

            if (feedback.length === 0) {
                return res.status(404).json({ error: 'Feedback not found' });
            }

            res.json(feedback[0]);
        } catch (error) {
            console.error('Get feedback error:', error);
            res.status(500).json({ error: 'Failed to fetch feedback' });
        }
    },

    // Get feedback for series
    getFeedbackBySeries: async (req, res) => {
        try {
            const { seriesId } = req.params;

            const [feedback] = await db.query(`
                SELECT
                    f.*,
                    v.FIRST_NAME,
                    v.LAST_NAME
                FROM MSK_FEEDBACK f
                JOIN MSK_VIEWER v ON f.VIEWER_ID = v.VIEWER_ID
                WHERE f.SERIES_ID = ?
                ORDER BY f.DATE DESC
            `, [seriesId]);

            res.json(feedback);
        } catch (error) {
            console.error('Get feedback error:', error);
            res.status(500).json({ error: 'Failed to fetch feedback' });
        }
    },

    // Get viewer's feedback
    getMyFeedback: async (req, res) => {
        try {
            const viewerId = req.viewer.viewerId;

            const [feedback] = await db.query(`
                SELECT
                    f.*,
                    s.NAME as seriesName
                FROM MSK_FEEDBACK f
                JOIN MSK_WEB_SERIES s ON f.SERIES_ID = s.SERIES_ID
                WHERE f.VIEWER_ID = ?
                ORDER BY f.DATE DESC
            `, [viewerId]);

            res.json(feedback);
        } catch (error) {
            console.error('Get my feedback error:', error);
            res.status(500).json({ error: 'Failed to fetch feedback' });
        }
    },

    // Get all feedback (Admin only)
    getAllFeedback: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const [feedback] = await db.query(`
                SELECT
                    f.*,
                    v.FIRST_NAME,
                    v.LAST_NAME,
                    v.EMAIL,
                    s.NAME as seriesName
                FROM MSK_FEEDBACK f
                JOIN MSK_VIEWER v ON f.VIEWER_ID = v.VIEWER_ID
                JOIN MSK_WEB_SERIES s ON f.SERIES_ID = s.SERIES_ID
                ORDER BY f.DATE DESC
                LIMIT ? OFFSET ?
            `, [parseInt(limit), parseInt(offset)]);

            const [countResult] = await db.query(
                'SELECT COUNT(*) as total FROM MSK_FEEDBACK'
            );

            res.json({
                feedback,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: countResult[0].total,
                    pages: Math.ceil(countResult[0].total / limit)
                }
            });
        } catch (error) {
            console.error('Get all feedback error:', error);
            res.status(500).json({ error: 'Failed to fetch feedback' });
        }
    }
};

module.exports = feedbackController;
