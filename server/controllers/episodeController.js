const db = require('../config/database');

const episodeController = {
    // Get episode by ID
    getEpisodeById: async (req, res) => {
        try {
            const { id } = req.params;

            const [episodes] = await db.query(`
                SELECT e.*, s.NAME as seriesName
                FROM MSK_EPISODE e
                JOIN MSK_WEB_SERIES s ON e.SERIES_ID = s.SERIES_ID
                WHERE e.EPISODE_ID = ?
            `, [id]);

            if (episodes.length === 0) {
                return res.status(404).json({ error: 'Episode not found' });
            }

            res.json(episodes[0]);
        } catch (error) {
            console.error('Get episode error:', error);
            res.status(500).json({ error: 'Failed to fetch episode' });
        }
    },

    // Get episodes by series
    getEpisodesBySeries: async (req, res) => {
        try {
            const { seriesId } = req.params;

            const [episodes] = await db.query(`
                SELECT * FROM MSK_EPISODE
                WHERE SERIES_ID = ?
                ORDER BY EPISODE_NO
            `, [seriesId]);

            res.json(episodes);
        } catch (error) {
            console.error('Get episodes by series error:', error);
            res.status(500).json({ error: 'Failed to fetch episodes' });
        }
    },

    // Update watch progress
    updateWatchProgress: async (req, res) => {
        try {
            const { episodeId, seriesId } = req.params;
            const { progress } = req.body;
            const viewerId = req.viewer.viewerId;

            // Check if watch history exists
            const [existing] = await db.query(`
                SELECT * FROM MSK_WATCH_HISTORY
                WHERE VIEWER_ID = ? AND EPISODE_ID = ? AND SERIES_ID = ?
            `, [viewerId, episodeId, seriesId]);

            if (existing.length > 0) {
                // Update existing
                await db.query(`
                    UPDATE MSK_WATCH_HISTORY
                    SET WATCH_PROGRESS = ?, LAST_WATCHED = NOW()
                    WHERE VIEWER_ID = ? AND EPISODE_ID = ? AND SERIES_ID = ?
                `, [progress, viewerId, episodeId, seriesId]);
            } else {
                // Insert new
                await db.query(`
                    INSERT INTO MSK_WATCH_HISTORY (VIEWER_ID, EPISODE_ID, SERIES_ID, WATCH_PROGRESS)
                    VALUES (?, ?, ?, ?)
                `, [viewerId, episodeId, seriesId, progress]);
            }

            res.json({ message: 'Watch progress updated' });
        } catch (error) {
            console.error('Update watch progress error:', error);
            res.status(500).json({ error: 'Failed to update watch progress' });
        }
    },

    // Get continue watching
    getContinueWatching: async (req, res) => {
        try {
            const viewerId = req.viewer.viewerId;

            const [history] = await db.query(`
                SELECT
                    wh.*,
                    e.EPISODE_NO,
                    e.EPISODE_TITLE,
                    e.DURATION_MIN,
                    e.THUMBNAIL_URL,
                    s.NAME as seriesName,
                    s.SERIES_ID
                FROM MSK_WATCH_HISTORY wh
                JOIN MSK_EPISODE e ON wh.EPISODE_ID = e.EPISODE_ID
                JOIN MSK_WEB_SERIES s ON wh.SERIES_ID = s.SERIES_ID
                WHERE wh.VIEWER_ID = ? AND wh.WATCH_PROGRESS < 90
                ORDER BY wh.LAST_WATCHED DESC
                LIMIT 10
            `, [viewerId]);

            res.json(history);
        } catch (error) {
            console.error('Get continue watching error:', error);
            res.status(500).json({ error: 'Failed to fetch watch history' });
        }
    }
};

module.exports = episodeController;
