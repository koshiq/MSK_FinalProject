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

    // Create new episode (Admin/Employee only)
    createEpisode: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { 
                seriesId, 
                episodeNo, 
                episodeTitle, 
                durationMin, 
                videoUrl, 
                thumbnailUrl 
            } = req.body;

            // Check if series exists
            const [series] = await connection.query(
                'SELECT SERIES_ID FROM MSK_WEB_SERIES WHERE SERIES_ID = ?',
                [seriesId]
            );

            if (series.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Series not found' });
            }

            // Check if episode number already exists for this series
            const [existing] = await connection.query(
                'SELECT EPISODE_ID FROM MSK_EPISODE WHERE SERIES_ID = ? AND EPISODE_NO = ?',
                [seriesId, episodeNo]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'Episode number already exists for this series' });
            }

            // Insert episode
            const [result] = await connection.query(`
                INSERT INTO MSK_EPISODE (SERIES_ID, EPISODE_NO, EPISODE_TITLE, DURATION_MIN, VIDEO_URL, THUMBNAIL_URL)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [seriesId, episodeNo, episodeTitle || null, durationMin || null, videoUrl || null, thumbnailUrl || null]);

            // Update episode count in series
            await connection.query(`
                UPDATE MSK_WEB_SERIES 
                SET NUMBER_OF_EPISODES = (SELECT COUNT(*) FROM MSK_EPISODE WHERE SERIES_ID = ?)
                WHERE SERIES_ID = ?
            `, [seriesId, seriesId]);

            await connection.commit();

            res.status(201).json({
                message: 'Episode created successfully',
                episode: {
                    id: result.insertId,
                    seriesId,
                    episodeNo,
                    episodeTitle,
                    durationMin
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Create episode error:', error);
            res.status(500).json({ error: 'Failed to create episode' });
        } finally {
            connection.release();
        }
    },

    // Update episode (Admin/Employee only)
    updateEpisode: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;
            const { 
                episodeNo, 
                episodeTitle, 
                durationMin, 
                viewers,
                techInterruption,
                videoUrl, 
                thumbnailUrl 
            } = req.body;

            // Check if episode exists
            const [existing] = await connection.query(
                'SELECT EPISODE_ID, SERIES_ID FROM MSK_EPISODE WHERE EPISODE_ID = ?',
                [id]
            );

            if (existing.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Episode not found' });
            }

            const seriesId = existing[0].SERIES_ID;

            // If changing episode number, check for duplicates
            if (episodeNo !== undefined) {
                const [duplicate] = await connection.query(
                    'SELECT EPISODE_ID FROM MSK_EPISODE WHERE SERIES_ID = ? AND EPISODE_NO = ? AND EPISODE_ID != ?',
                    [seriesId, episodeNo, id]
                );

                if (duplicate.length > 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Episode number already exists for this series' });
                }
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (episodeNo !== undefined) {
                updates.push('EPISODE_NO = ?');
                values.push(episodeNo);
            }
            if (episodeTitle !== undefined) {
                updates.push('EPISODE_TITLE = ?');
                values.push(episodeTitle);
            }
            if (durationMin !== undefined) {
                updates.push('DURATION_MIN = ?');
                values.push(durationMin);
            }
            if (viewers !== undefined) {
                updates.push('VIEWERS = ?');
                values.push(viewers);
            }
            if (techInterruption !== undefined) {
                updates.push('TECH_INTERRUPTION = ?');
                values.push(techInterruption === true || techInterruption === 'Y' ? 'Y' : 'N');
            }
            if (videoUrl !== undefined) {
                updates.push('VIDEO_URL = ?');
                values.push(videoUrl);
            }
            if (thumbnailUrl !== undefined) {
                updates.push('THUMBNAIL_URL = ?');
                values.push(thumbnailUrl);
            }

            if (updates.length === 0) {
                await connection.rollback();
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(id);

            await connection.query(
                `UPDATE MSK_EPISODE SET ${updates.join(', ')} WHERE EPISODE_ID = ?`,
                values
            );

            await connection.commit();

            res.json({ message: 'Episode updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Update episode error:', error);
            res.status(500).json({ error: 'Failed to update episode' });
        } finally {
            connection.release();
        }
    },

    // Delete episode (Admin only)
    deleteEpisode: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { id } = req.params;

            // Check if episode exists
            const [existing] = await connection.query(
                'SELECT EPISODE_ID, SERIES_ID, EPISODE_TITLE FROM MSK_EPISODE WHERE EPISODE_ID = ?',
                [id]
            );

            if (existing.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Episode not found' });
            }

            const seriesId = existing[0].SERIES_ID;
            const episodeTitle = existing[0].EPISODE_TITLE;

            // Delete episode
            await connection.query(
                'DELETE FROM MSK_EPISODE WHERE EPISODE_ID = ?',
                [id]
            );

            // Update episode count in series
            await connection.query(`
                UPDATE MSK_WEB_SERIES 
                SET NUMBER_OF_EPISODES = (SELECT COUNT(*) FROM MSK_EPISODE WHERE SERIES_ID = ?)
                WHERE SERIES_ID = ?
            `, [seriesId, seriesId]);

            await connection.commit();

            res.json({ 
                message: 'Episode deleted successfully',
                deleted: { id: parseInt(id), title: episodeTitle }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Delete episode error:', error);
            res.status(500).json({ error: 'Failed to delete episode' });
        } finally {
            connection.release();
        }
    },

    // Update watch progress
    updateWatchProgress: async (req, res) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { episodeId, seriesId } = req.params;
            const { progress } = req.body;
            const viewerId = req.viewer.viewerId;

            // Validate episode exists
            const [episode] = await connection.query(
                'SELECT EPISODE_ID FROM MSK_EPISODE WHERE EPISODE_ID = ? AND SERIES_ID = ?',
                [episodeId, seriesId]
            );

            if (episode.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: 'Episode not found' });
            }

            // Check if watch history exists
            const [existing] = await connection.query(`
                SELECT HISTORY_ID FROM MSK_WATCH_HISTORY
                WHERE VIEWER_ID = ? AND EPISODE_ID = ? AND SERIES_ID = ?
            `, [viewerId, episodeId, seriesId]);

            if (existing.length > 0) {
                // Update existing
                await connection.query(`
                    UPDATE MSK_WATCH_HISTORY
                    SET WATCH_PROGRESS = ?, LAST_WATCHED = NOW()
                    WHERE VIEWER_ID = ? AND EPISODE_ID = ? AND SERIES_ID = ?
                `, [progress, viewerId, episodeId, seriesId]);
            } else {
                // Insert new
                await connection.query(`
                    INSERT INTO MSK_WATCH_HISTORY (VIEWER_ID, EPISODE_ID, SERIES_ID, WATCH_PROGRESS)
                    VALUES (?, ?, ?, ?)
                `, [viewerId, episodeId, seriesId, progress]);
            }

            // Increment viewer count for the episode
            await connection.query(`
                UPDATE MSK_EPISODE SET VIEWERS = VIEWERS + 1 
                WHERE EPISODE_ID = ? AND SERIES_ID = ?
            `, [episodeId, seriesId]);

            await connection.commit();

            res.json({ message: 'Watch progress updated' });
        } catch (error) {
            await connection.rollback();
            console.error('Update watch progress error:', error);
            res.status(500).json({ error: 'Failed to update watch progress' });
        } finally {
            connection.release();
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
                JOIN MSK_EPISODE e ON wh.EPISODE_ID = e.EPISODE_ID AND wh.SERIES_ID = e.SERIES_ID
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
