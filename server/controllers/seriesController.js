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

    // Create new series (Admin/Employee only)
    createSeries: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { 
                name, 
                numberOfEpisodes, 
                releaseDate, 
                countryOfRelease, 
                description,
                posterUrl,
                bannerUrl,
                genres 
            } = req.body;

            // Insert series
            const [result] = await connection.query(`
                INSERT INTO MSK_WEB_SERIES (NAME, NUMBER_OF_EPISODES, RELEASE_DATE, COUNTRY_OF_RELEASE, DESCRIPTION, POSTER_URL, BANNER_URL)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [name, numberOfEpisodes || null, releaseDate || null, countryOfRelease, description || null, posterUrl || null, bannerUrl || null]);

            const seriesId = result.insertId;

            // Insert genres if provided
            if (genres && Array.isArray(genres) && genres.length > 0) {
                const genreValues = genres.map(genre => [genre, seriesId]);
                await connection.query(`
                    INSERT INTO MSK_SERIES_TYPE (TYPE_NAME, SERIES_ID) VALUES ?
                `, [genreValues]);
            }

            await connection.commit();

            res.status(201).json({
                message: 'Series created successfully',
                seriesId,
                series: {
                    id: seriesId,
                    name,
                    numberOfEpisodes,
                    releaseDate,
                    countryOfRelease,
                    description,
                    genres
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Create series error:', error);
            res.status(500).json({ error: 'Failed to create series' });
        } finally {
            connection.release();
        }
    },

    // Update series (Admin/Employee only)
    updateSeries: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { 
                name, 
                numberOfEpisodes, 
                releaseDate, 
                countryOfRelease, 
                description,
                posterUrl,
                bannerUrl,
                genres 
            } = req.body;

            // Check if series exists
            const [existing] = await connection.query(
                'SELECT SERIES_ID FROM MSK_WEB_SERIES WHERE SERIES_ID = ?',
                [id]
            );

            if (existing.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Series not found' });
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (name !== undefined) {
                updates.push('NAME = ?');
                values.push(name);
            }
            if (numberOfEpisodes !== undefined) {
                updates.push('NUMBER_OF_EPISODES = ?');
                values.push(numberOfEpisodes);
            }
            if (releaseDate !== undefined) {
                updates.push('RELEASE_DATE = ?');
                values.push(releaseDate);
            }
            if (countryOfRelease !== undefined) {
                updates.push('COUNTRY_OF_RELEASE = ?');
                values.push(countryOfRelease);
            }
            if (description !== undefined) {
                updates.push('DESCRIPTION = ?');
                values.push(description);
            }
            if (posterUrl !== undefined) {
                updates.push('POSTER_URL = ?');
                values.push(posterUrl);
            }
            if (bannerUrl !== undefined) {
                updates.push('BANNER_URL = ?');
                values.push(bannerUrl);
            }

            if (updates.length > 0) {
                values.push(id);
                await connection.query(
                    `UPDATE MSK_WEB_SERIES SET ${updates.join(', ')} WHERE SERIES_ID = ?`,
                    values
                );
            }

            // Update genres if provided
            if (genres !== undefined && Array.isArray(genres)) {
                // Delete existing genres
                await connection.query(
                    'DELETE FROM MSK_SERIES_TYPE WHERE SERIES_ID = ?',
                    [id]
                );

                // Insert new genres
                if (genres.length > 0) {
                    const genreValues = genres.map(genre => [genre, id]);
                    await connection.query(`
                        INSERT INTO MSK_SERIES_TYPE (TYPE_NAME, SERIES_ID) VALUES ?
                    `, [genreValues]);
                }
            }

            await connection.commit();

            res.json({ message: 'Series updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Update series error:', error);
            res.status(500).json({ error: 'Failed to update series' });
        } finally {
            connection.release();
        }
    },

    // Delete series (Admin only)
    deleteSeries: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;

            // Check if series exists
            const [existing] = await connection.query(
                'SELECT SERIES_ID, NAME FROM MSK_WEB_SERIES WHERE SERIES_ID = ?',
                [id]
            );

            if (existing.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Series not found' });
            }

            const seriesName = existing[0].NAME;

            // Delete series (cascades to related tables due to ON DELETE CASCADE)
            await connection.query(
                'DELETE FROM MSK_WEB_SERIES WHERE SERIES_ID = ?',
                [id]
            );

            await connection.commit();

            res.json({ 
                message: 'Series deleted successfully',
                deleted: { id: parseInt(id), name: seriesName }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Delete series error:', error);
            res.status(500).json({ error: 'Failed to delete series' });
        } finally {
            connection.release();
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
                    COALESCE(SUM(e.VIEWERS), 0) as totalViews
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

            if (!q || q.trim() === '') {
                return res.json([]);
            }

            const searchTerm = `%${q}%`;

            const [series] = await db.query(`
                SELECT
                    s.*,
                    GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres
                FROM MSK_WEB_SERIES s
                LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
                WHERE s.NAME LIKE ? OR s.DESCRIPTION LIKE ?
                GROUP BY s.SERIES_ID
                ORDER BY s.RELEASE_DATE DESC
            `, [searchTerm, searchTerm]);

            res.json(series);
        } catch (error) {
            console.error('Search series error:', error);
            res.status(500).json({ error: 'Failed to search series' });
        }
    },

    // Get all genres
    getAllGenres: async (req, res) => {
        try {
            const [genres] = await db.query(`
                SELECT DISTINCT TYPE_NAME as name, COUNT(*) as count
                FROM MSK_SERIES_TYPE
                GROUP BY TYPE_NAME
                ORDER BY TYPE_NAME
            `);
            res.json(genres);
        } catch (error) {
            console.error('Get genres error:', error);
            res.status(500).json({ error: 'Failed to fetch genres' });
        }
    },

    // Get all countries
    getAllCountries: async (req, res) => {
        try {
            const [countries] = await db.query(`
                SELECT COUNTRY_ID, COUNTRY_NAME
                FROM MSK_COUNTRY
                ORDER BY COUNTRY_NAME
            `);
            res.json(countries);
        } catch (error) {
            console.error('Get countries error:', error);
            res.status(500).json({ error: 'Failed to fetch countries' });
        }
    }
};

module.exports = seriesController;
