const db = require('../config/database');

const seriesController = {
    // Get all series
    getAllSeries: async (req, res) => {
        try {
            const [series] = await db.query(`
                SELECT
                    s.*,
                    GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres
                FROM MSK_WEB_SERIES s
                LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
                GROUP BY s.SERIES_ID
                ORDER BY s.RELEASE_DATE DESC
            `);
            res.json(series);
        } catch (error) {
            console.error('Get all series error:', error);
            res.status(500).json({ error: 'Failed to fetch series' });
        }
    },

    // Get series by ID
    getSeriesById: async (req, res) => {
        try {
            const { id } = req.params;

            const [series] = await db.query(`
                SELECT
                    s.*,
                    GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres,
                    GROUP_CONCAT(DISTINCT sd.DUBBING_LANGUAGE) as dubbing,
                    GROUP_CONCAT(DISTINCT ss.SUBTITLE_LANGUAGE) as subtitles
                FROM MSK_WEB_SERIES s
                LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
                LEFT JOIN MSK_SERIES_DUBBING sd ON s.SERIES_ID = sd.SERIES_ID
                LEFT JOIN MSK_SERIES_SUBTITLE ss ON s.SERIES_ID = ss.SERIES_ID
                WHERE s.SERIES_ID = ?
                GROUP BY s.SERIES_ID
            `, [id]);

            if (series.length === 0) {
                return res.status(404).json({ error: 'Series not found' });
            }

            // Get episodes for this series
            const [episodes] = await db.query(`
                SELECT * FROM MSK_EPISODE
                WHERE SERIES_ID = ?
                ORDER BY EPISODE_NO
            `, [id]);

            // Get average rating
            const [rating] = await db.query(`
                SELECT AVG(RATING) as avgRating, COUNT(*) as totalReviews
                FROM MSK_FEEDBACK
                WHERE SERIES_ID = ?
            `, [id]);

            res.json({
                ...series[0],
                episodes,
                avgRating: rating[0].avgRating || 0,
                totalReviews: rating[0].totalReviews || 0
            });
        } catch (error) {
            console.error('Get series by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch series' });
        }
    },

    // Get series by genre
    getSeriesByGenre: async (req, res) => {
        try {
            const { genre } = req.params;

            const [series] = await db.query(`
                SELECT
                    s.*,
                    GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres
                FROM MSK_WEB_SERIES s
                LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
                WHERE s.SERIES_ID IN (
                    SELECT SERIES_ID FROM MSK_SERIES_TYPE WHERE TYPE_NAME = ?
                )
                GROUP BY s.SERIES_ID
            `, [genre]);

            res.json(series);
        } catch (error) {
            console.error('Get series by genre error:', error);
            res.status(500).json({ error: 'Failed to fetch series' });
        }
    },

    // Get featured/trending series
    getFeaturedSeries: async (req, res) => {
        try {
            const [series] = await db.query(`
                SELECT
                    s.*,
                    GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres,
                    SUM(e.VIEWERS) as totalViews
                FROM MSK_WEB_SERIES s
                LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
                LEFT JOIN MSK_EPISODE e ON s.SERIES_ID = e.SERIES_ID
                GROUP BY s.SERIES_ID
                ORDER BY totalViews DESC
                LIMIT 6
            `);
            res.json(series);
        } catch (error) {
            console.error('Get featured series error:', error);
            res.status(500).json({ error: 'Failed to fetch featured series' });
        }
    },

    // Search series
    searchSeries: async (req, res) => {
        try {
            const { q } = req.query;

            const [series] = await db.query(`
                SELECT
                    s.*,
                    GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres
                FROM MSK_WEB_SERIES s
                LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
                WHERE s.NAME LIKE ? OR s.DESCRIPTION LIKE ?
                GROUP BY s.SERIES_ID
            `, [`%${q}%`, `%${q}%`]);

            res.json(series);
        } catch (error) {
            console.error('Search series error:', error);
            res.status(500).json({ error: 'Failed to search series' });
        }
    }
};

module.exports = seriesController;
