-- Stored Procedures for MSK Streaming Platform
-- These procedures encapsulate common database operations

USE streaming_platform;

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS sp_create_series;
DROP PROCEDURE IF EXISTS sp_update_series;
DROP PROCEDURE IF EXISTS sp_delete_series;
DROP PROCEDURE IF EXISTS sp_get_series_details;
DROP PROCEDURE IF EXISTS sp_create_episode;
DROP PROCEDURE IF EXISTS sp_update_episode;
DROP PROCEDURE IF EXISTS sp_delete_episode;
DROP PROCEDURE IF EXISTS sp_add_feedback;
DROP PROCEDURE IF EXISTS sp_update_feedback;
DROP PROCEDURE IF EXISTS sp_delete_feedback;
DROP PROCEDURE IF EXISTS sp_update_watch_progress;
DROP PROCEDURE IF EXISTS sp_get_continue_watching;
DROP PROCEDURE IF EXISTS sp_get_featured_series;
DROP PROCEDURE IF EXISTS sp_search_series;

DELIMITER //

-- ============================================================================
-- SERIES PROCEDURES
-- ============================================================================

-- Create a new series
CREATE PROCEDURE sp_create_series(
    IN p_name VARCHAR(50),
    IN p_num_episodes INT,
    IN p_release_date DATE,
    IN p_country VARCHAR(30),
    IN p_poster_url VARCHAR(255),
    IN p_description TEXT,
    OUT p_series_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO MSK_WEB_SERIES (
        NAME,
        NUMBER_OF_EPISODES,
        RELEASE_DATE,
        COUNTRY_OF_RELEASE,
        POSTER_URL,
        DESCRIPTION
    ) VALUES (
        p_name,
        p_num_episodes,
        p_release_date,
        p_country,
        p_poster_url,
        p_description
    );

    SET p_series_id = LAST_INSERT_ID();

    COMMIT;
END //

-- Update an existing series
CREATE PROCEDURE sp_update_series(
    IN p_series_id INT,
    IN p_name VARCHAR(50),
    IN p_num_episodes INT,
    IN p_release_date DATE,
    IN p_country VARCHAR(30),
    IN p_poster_url VARCHAR(255),
    IN p_description TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE MSK_WEB_SERIES
    SET
        NAME = COALESCE(p_name, NAME),
        NUMBER_OF_EPISODES = COALESCE(p_num_episodes, NUMBER_OF_EPISODES),
        RELEASE_DATE = COALESCE(p_release_date, RELEASE_DATE),
        COUNTRY_OF_RELEASE = COALESCE(p_country, COUNTRY_OF_RELEASE),
        POSTER_URL = COALESCE(p_poster_url, POSTER_URL),
        DESCRIPTION = COALESCE(p_description, DESCRIPTION)
    WHERE SERIES_ID = p_series_id;

    COMMIT;
END //

-- Delete a series (cascades to episodes, feedback, etc.)
CREATE PROCEDURE sp_delete_series(
    IN p_series_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    DELETE FROM MSK_WEB_SERIES WHERE SERIES_ID = p_series_id;

    COMMIT;
END //

-- Get series details with all related information
CREATE PROCEDURE sp_get_series_details(
    IN p_series_id INT
)
BEGIN
    -- Get series basic info with genres
    SELECT
        s.*,
        GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres,
        GROUP_CONCAT(DISTINCT sd.DUBBING_LANGUAGE) as dubbing,
        GROUP_CONCAT(DISTINCT ss.SUBTITLE_LANGUAGE) as subtitles,
        COALESCE(AVG(f.RATING), 0) as avgRating,
        COUNT(DISTINCT f.FEEDBACK_ID) as totalReviews
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
    LEFT JOIN MSK_SERIES_DUBBING sd ON s.SERIES_ID = sd.SERIES_ID
    LEFT JOIN MSK_SERIES_SUBTITLE ss ON s.SERIES_ID = ss.SERIES_ID
    LEFT JOIN MSK_FEEDBACK f ON s.SERIES_ID = f.SERIES_ID
    WHERE s.SERIES_ID = p_series_id
    GROUP BY s.SERIES_ID;

    -- Get episodes for this series
    SELECT *
    FROM MSK_EPISODE
    WHERE SERIES_ID = p_series_id
    ORDER BY EPISODE_NO;
END //

-- Get featured/trending series based on total views
CREATE PROCEDURE sp_get_featured_series(
    IN p_limit INT
)
BEGIN
    SELECT
        s.*,
        GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres,
        COALESCE(SUM(e.VIEWERS), 0) as totalViews
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
    LEFT JOIN MSK_EPISODE e ON s.SERIES_ID = e.SERIES_ID
    GROUP BY s.SERIES_ID
    ORDER BY totalViews DESC
    LIMIT p_limit;
END //

-- Search series by name or description
CREATE PROCEDURE sp_search_series(
    IN p_search_term VARCHAR(255)
)
BEGIN
    SELECT
        s.*,
        GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
    WHERE s.NAME LIKE CONCAT('%', p_search_term, '%')
       OR s.DESCRIPTION LIKE CONCAT('%', p_search_term, '%')
    GROUP BY s.SERIES_ID
    ORDER BY s.RELEASE_DATE DESC;
END //

-- ============================================================================
-- EPISODE PROCEDURES
-- ============================================================================

-- Create a new episode
CREATE PROCEDURE sp_create_episode(
    IN p_series_id INT,
    IN p_episode_no INT,
    IN p_title VARCHAR(50),
    IN p_duration INT,
    OUT p_episode_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO MSK_EPISODE (
        SERIES_ID,
        EPISODE_NO,
        EPISODE_TITLE,
        DURATION_MIN,
        VIEWERS,
        TECH_INTERRUPTION
    ) VALUES (
        p_series_id,
        p_episode_no,
        p_title,
        p_duration,
        0,
        'N'
    );

    SET p_episode_id = LAST_INSERT_ID();

    COMMIT;
END //

-- Update an existing episode
CREATE PROCEDURE sp_update_episode(
    IN p_episode_id INT,
    IN p_episode_no INT,
    IN p_title VARCHAR(50),
    IN p_duration INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE MSK_EPISODE
    SET
        EPISODE_NO = COALESCE(p_episode_no, EPISODE_NO),
        EPISODE_TITLE = COALESCE(p_title, EPISODE_TITLE),
        DURATION_MIN = COALESCE(p_duration, DURATION_MIN)
    WHERE EPISODE_ID = p_episode_id;

    COMMIT;
END //

-- Delete an episode
CREATE PROCEDURE sp_delete_episode(
    IN p_episode_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    DELETE FROM MSK_EPISODE WHERE EPISODE_ID = p_episode_id;

    COMMIT;
END //

-- ============================================================================
-- FEEDBACK PROCEDURES
-- ============================================================================

-- Add feedback/review
CREATE PROCEDURE sp_add_feedback(
    IN p_viewer_id INT,
    IN p_series_id INT,
    IN p_rating DECIMAL(2,1),
    IN p_text VARCHAR(2000),
    OUT p_feedback_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO MSK_FEEDBACK (
        VIEWER_ID,
        SERIES_ID,
        RATING,
        DATE,
        TEXT
    ) VALUES (
        p_viewer_id,
        p_series_id,
        p_rating,
        CURDATE(),
        p_text
    );

    SET p_feedback_id = LAST_INSERT_ID();

    COMMIT;
END //

-- Update feedback/review
CREATE PROCEDURE sp_update_feedback(
    IN p_feedback_id INT,
    IN p_rating DECIMAL(2,1),
    IN p_text VARCHAR(2000)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE MSK_FEEDBACK
    SET
        RATING = COALESCE(p_rating, RATING),
        TEXT = COALESCE(p_text, TEXT),
        DATE = CURDATE()
    WHERE FEEDBACK_ID = p_feedback_id;

    COMMIT;
END //

-- Delete feedback/review
CREATE PROCEDURE sp_delete_feedback(
    IN p_feedback_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    DELETE FROM MSK_FEEDBACK WHERE FEEDBACK_ID = p_feedback_id;

    COMMIT;
END //

-- ============================================================================
-- WATCH HISTORY PROCEDURES
-- ============================================================================

-- Update or insert watch progress
CREATE PROCEDURE sp_update_watch_progress(
    IN p_viewer_id INT,
    IN p_episode_id INT,
    IN p_series_id INT,
    IN p_progress INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO MSK_WATCH_HISTORY (
        VIEWER_ID,
        EPISODE_ID,
        SERIES_ID,
        WATCH_PROGRESS,
        LAST_WATCHED
    ) VALUES (
        p_viewer_id,
        p_episode_id,
        p_series_id,
        p_progress,
        NOW()
    )
    ON DUPLICATE KEY UPDATE
        WATCH_PROGRESS = p_progress,
        LAST_WATCHED = NOW();

    COMMIT;
END //

-- Get continue watching list for a viewer
CREATE PROCEDURE sp_get_continue_watching(
    IN p_viewer_id INT,
    IN p_limit INT
)
BEGIN
    SELECT
        wh.*,
        e.EPISODE_NO,
        e.EPISODE_TITLE,
        e.DURATION_MIN,
        s.NAME as seriesName,
        s.POSTER_URL
    FROM MSK_WATCH_HISTORY wh
    INNER JOIN MSK_EPISODE e ON wh.EPISODE_ID = e.EPISODE_ID
        AND wh.SERIES_ID = e.SERIES_ID
    INNER JOIN MSK_WEB_SERIES s ON wh.SERIES_ID = s.SERIES_ID
    WHERE wh.VIEWER_ID = p_viewer_id
        AND wh.WATCH_PROGRESS < 100
    ORDER BY wh.LAST_WATCHED DESC
    LIMIT p_limit;
END //

-- ============================================================================
-- ANALYTICS PROCEDURES
-- ============================================================================

-- Get top rated series
CREATE PROCEDURE sp_get_top_rated_series(
    IN p_limit INT
)
BEGIN
    SELECT
        s.*,
        GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres,
        AVG(f.RATING) as avgRating,
        COUNT(f.FEEDBACK_ID) as totalReviews
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
    LEFT JOIN MSK_FEEDBACK f ON s.SERIES_ID = f.SERIES_ID
    GROUP BY s.SERIES_ID
    HAVING totalReviews >= 1
    ORDER BY avgRating DESC, totalReviews DESC
    LIMIT p_limit;
END //

-- Get most viewed episodes
CREATE PROCEDURE sp_get_most_viewed_episodes(
    IN p_limit INT
)
BEGIN
    SELECT
        e.*,
        s.NAME as seriesName,
        s.POSTER_URL
    FROM MSK_EPISODE e
    INNER JOIN MSK_WEB_SERIES s ON e.SERIES_ID = s.SERIES_ID
    ORDER BY e.VIEWERS DESC
    LIMIT p_limit;
END //

-- Get series by genre
CREATE PROCEDURE sp_get_series_by_genre(
    IN p_genre VARCHAR(50)
)
BEGIN
    SELECT
        s.*,
        GROUP_CONCAT(DISTINCT st.TYPE_NAME) as genres
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
    WHERE s.SERIES_ID IN (
        SELECT SERIES_ID
        FROM MSK_SERIES_TYPE
        WHERE TYPE_NAME = p_genre
    )
    GROUP BY s.SERIES_ID;
END //

DELIMITER ;

-- Grant execute permissions
GRANT EXECUTE ON PROCEDURE sp_create_series TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_update_series TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_delete_series TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_get_series_details TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_create_episode TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_update_episode TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_delete_episode TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_add_feedback TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_update_feedback TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_delete_feedback TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_update_watch_progress TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_get_continue_watching TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_get_featured_series TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_search_series TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_get_top_rated_series TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_get_most_viewed_episodes TO 'root'@'localhost';
GRANT EXECUTE ON PROCEDURE sp_get_series_by_genre TO 'root'@'localhost';

-- Display created procedures
SHOW PROCEDURE STATUS WHERE Db = 'streaming_platform';
