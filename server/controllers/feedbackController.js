const db = require('../config/database');

const feedbackController = {
    // Add feedback
    addFeedback: async (req, res) => {
        try {
            const { seriesId, rating, text } = req.body;
            const viewerId = req.viewer.viewerId;

            const [result] = await db.query(`
                INSERT INTO MSK_FEEDBACK (VIEWER_ID, SERIES_ID, RATING, DATE, TEXT)
                VALUES (?, ?, ?, CURDATE(), ?)
            `, [viewerId, seriesId, rating, text]);

            res.status(201).json({
                message: 'Feedback added successfully',
                feedbackId: result.insertId
            });
        } catch (error) {
            console.error('Add feedback error:', error);
            res.status(500).json({ error: 'Failed to add feedback' });
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
    }
};

module.exports = feedbackController;
