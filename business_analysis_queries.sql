-- Business Analysis Queries for MSK Streaming Platform
-- Project Part II Requirement: 6 SQL Queries
USE streaming_platform;

-- ============================================================================
-- Q1) Table joins with at least 3 tables
-- ============================================================================
-- BUSINESS QUESTION: Which series have the highest viewer engagement, showing
-- total viewership across all episodes along with production house details and contract information?

SELECT
    s.SERIES_ID,
    s.NAME AS Series_Name,
    ph.NAME AS Production_House,
    ph.CITY AS PH_Location,
    COUNT(DISTINCT e.EPISODE_ID) AS Total_Episodes,
    SUM(e.VIEWERS) AS Total_Viewership,
    ROUND(AVG(e.VIEWERS), 0) AS Avg_Viewers_Per_Episode,
    c.RATE_PER_EPISODE AS Contract_Rate,
    ROUND(SUM(e.VIEWERS) / 1000000, 2) AS Viewership_Millions,
    CASE
        WHEN c.IS_RENEWED = 'Y' THEN 'Renewed'
        ELSE 'Not Renewed'
    END AS Contract_Status
FROM MSK_WEB_SERIES s
INNER JOIN MSK_EPISODE e ON s.SERIES_ID = e.SERIES_ID
INNER JOIN MSK_CONTRACTS c ON s.SERIES_ID = c.SERIES_ID
INNER JOIN MSK_PROD_HOUSE ph ON c.PROD_HOUSE_ID = ph.PRODUCTION_ID
GROUP BY s.SERIES_ID, s.NAME, ph.NAME, ph.CITY, c.RATE_PER_EPISODE, c.IS_RENEWED
HAVING Total_Viewership > 0
ORDER BY Total_Viewership DESC;

-- RESULT: Shows comprehensive view of series performance with production details
-- Helps identify which series generate most viewership and their contract status


-- ============================================================================
-- Q2) Multi-row subquery
-- ============================================================================
-- BUSINESS QUESTION: Which series have average ratings higher than the overall
-- platform average, and what are their engagement metrics?

SELECT
    s.SERIES_ID,
    s.NAME AS Series_Name,
    s.RELEASE_DATE,
    ROUND(AVG(f.RATING), 2) AS Avg_Rating,
    COUNT(DISTINCT f.FEEDBACK_ID) AS Total_Reviews,
    COUNT(DISTINCT e.EPISODE_ID) AS Total_Episodes,
    GROUP_CONCAT(DISTINCT st.TYPE_NAME ORDER BY st.TYPE_NAME SEPARATOR ', ') AS Genres
FROM MSK_WEB_SERIES s
LEFT JOIN MSK_FEEDBACK f ON s.SERIES_ID = f.SERIES_ID
LEFT JOIN MSK_EPISODE e ON s.SERIES_ID = e.SERIES_ID
LEFT JOIN MSK_SERIES_TYPE st ON s.SERIES_ID = st.SERIES_ID
WHERE s.SERIES_ID IN (
    -- Subquery: Get series with ratings above platform average
    SELECT DISTINCT f2.SERIES_ID
    FROM MSK_FEEDBACK f2
    GROUP BY f2.SERIES_ID
    HAVING AVG(f2.RATING) > (
        SELECT AVG(RATING) FROM MSK_FEEDBACK
    )
)
GROUP BY s.SERIES_ID, s.NAME, s.RELEASE_DATE
ORDER BY Avg_Rating DESC, Total_Reviews DESC;

-- RESULT: Identifies top-performing series that exceed platform quality standards
-- Useful for promotional decisions and understanding what content resonates with viewers


-- ============================================================================
-- Q3) Correlated subquery
-- ============================================================================
-- BUSINESS QUESTION: For each production house, find series that have generated
-- viewership above the production house's average, indicating their star performers?

SELECT
    ph.PRODUCTION_ID,
    ph.NAME AS Production_House,
    ph.CITY,
    s.SERIES_ID,
    s.NAME AS Series_Name,
    (SELECT SUM(e.VIEWERS)
     FROM MSK_EPISODE e
     WHERE e.SERIES_ID = s.SERIES_ID) AS Series_Total_Viewers,
    (SELECT ROUND(AVG(total_views), 0)
     FROM (
         SELECT s2.SERIES_ID, SUM(e2.VIEWERS) as total_views
         FROM MSK_WEB_SERIES s2
         INNER JOIN MSK_EPISODE e2 ON s2.SERIES_ID = e2.SERIES_ID
         INNER JOIN MSK_CONTRACTS c2 ON s2.SERIES_ID = c2.SERIES_ID
         WHERE c2.PROD_HOUSE_ID = ph.PRODUCTION_ID
         GROUP BY s2.SERIES_ID
     ) AS house_avg
    ) AS House_Avg_Viewers,
    c.IS_RENEWED AS Renewed_Status
FROM MSK_PROD_HOUSE ph
INNER JOIN MSK_CONTRACTS c ON ph.PRODUCTION_ID = c.PROD_HOUSE_ID
INNER JOIN MSK_WEB_SERIES s ON c.SERIES_ID = s.SERIES_ID
WHERE (
    -- Correlated subquery: Series with above-average viewership for their production house
    SELECT SUM(e.VIEWERS)
    FROM MSK_EPISODE e
    WHERE e.SERIES_ID = s.SERIES_ID
) > (
    SELECT AVG(total_views)
    FROM (
        SELECT SUM(e2.VIEWERS) as total_views
        FROM MSK_EPISODE e2
        INNER JOIN MSK_WEB_SERIES s2 ON e2.SERIES_ID = s2.SERIES_ID
        INNER JOIN MSK_CONTRACTS c2 ON s2.SERIES_ID = c2.SERIES_ID
        WHERE c2.PROD_HOUSE_ID = ph.PRODUCTION_ID
        GROUP BY s2.SERIES_ID
    ) AS avg_calc
)
ORDER BY ph.NAME, Series_Total_Viewers DESC;

-- RESULT: Shows which series are star performers for each production house
-- Helps production houses identify their most successful content for contract renewal


-- ============================================================================
-- Q4) SET operator query (UNION)
-- ============================================================================
-- BUSINESS QUESTION: What is the complete view of all content contributors
-- (both producers and production houses) with their associated series count?

SELECT
    'Producer' AS Contributor_Type,
    CONCAT(p.FIRST_NAME, ' ', COALESCE(p.LAST_NAME, '')) AS Name,
    p.EMAIL AS Contact_Email,
    p.CITY AS Location,
    COUNT(DISTINCT c.SERIES_ID) AS Series_Count,
    'Individual' AS Entity_Type
FROM MSK_PRODUCER p
INNER JOIN MSK_COUNTRY c ON p.PRODUCER_ID = c.PRODUCER_ID
GROUP BY p.PRODUCER_ID, p.FIRST_NAME, p.LAST_NAME, p.EMAIL, p.CITY

UNION

SELECT
    'Production House' AS Contributor_Type,
    ph.NAME AS Name,
    CONCAT(ph.CITY, ', ', ph.STATE) AS Contact_Email,
    ph.CITY AS Location,
    COUNT(DISTINCT ct.SERIES_ID) AS Series_Count,
    'Organization' AS Entity_Type
FROM MSK_PROD_HOUSE ph
LEFT JOIN MSK_CONTRACTS ct ON ph.PRODUCTION_ID = ct.PROD_HOUSE_ID
GROUP BY ph.PRODUCTION_ID, ph.NAME, ph.CITY, ph.STATE

ORDER BY Series_Count DESC, Contributor_Type, Name;

-- RESULT: Unified view of all content contributors and their productivity
-- Useful for understanding the network of content creators and their output


-- ============================================================================
-- Q5) Query with inline view (WITH clause)
-- ============================================================================
-- BUSINESS QUESTION: What is the engagement analysis showing series performance
-- metrics including viewership, ratings, and revenue potential?

WITH SeriesMetrics AS (
    -- Calculate viewership metrics per series
    SELECT
        s.SERIES_ID,
        s.NAME,
        COUNT(DISTINCT e.EPISODE_ID) AS episode_count,
        SUM(e.VIEWERS) AS total_viewers,
        ROUND(AVG(e.VIEWERS), 0) AS avg_viewers_per_episode,
        ROUND(SUM(e.DURATION_MIN) / 60.0, 1) AS total_hours_content
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_EPISODE e ON s.SERIES_ID = e.SERIES_ID
    GROUP BY s.SERIES_ID, s.NAME
),
RatingMetrics AS (
    -- Calculate rating metrics per series
    SELECT
        s.SERIES_ID,
        ROUND(AVG(f.RATING), 2) AS avg_rating,
        COUNT(f.FEEDBACK_ID) AS review_count,
        COUNT(DISTINCT f.VIEWER_ID) AS unique_reviewers
    FROM MSK_WEB_SERIES s
    LEFT JOIN MSK_FEEDBACK f ON s.SERIES_ID = f.SERIES_ID
    GROUP BY s.SERIES_ID
),
RevenueMetrics AS (
    -- Calculate potential revenue per series
    SELECT
        c.SERIES_ID,
        c.RATE_PER_EPISODE,
        c.IS_RENEWED,
        ph.NAME AS production_house
    FROM MSK_CONTRACTS c
    INNER JOIN MSK_PROD_HOUSE ph ON c.PROD_HOUSE_ID = ph.PRODUCTION_ID
)
SELECT
    sm.SERIES_ID,
    sm.NAME AS Series_Name,
    sm.episode_count AS Episodes,
    sm.total_viewers AS Total_Viewership,
    sm.avg_viewers_per_episode AS Avg_Episode_Viewers,
    COALESCE(rm.avg_rating, 0) AS Avg_Rating,
    COALESCE(rm.review_count, 0) AS Reviews,
    revm.production_house AS Production_House,
    revm.RATE_PER_EPISODE AS Rate_Per_Episode,
    ROUND(sm.episode_count * revm.RATE_PER_EPISODE, 2) AS Est_Total_Cost,
    CASE
        WHEN revm.IS_RENEWED = 'Y' THEN 'Yes'
        ELSE 'No'
    END AS Contract_Renewed,
    -- Performance Score: Combination of viewership and ratings
    ROUND(
        (sm.total_viewers / 1000000) * 0.6 +
        (COALESCE(rm.avg_rating, 0) * 10) * 0.4,
        2
    ) AS Performance_Score
FROM SeriesMetrics sm
LEFT JOIN RatingMetrics rm ON sm.SERIES_ID = rm.SERIES_ID
LEFT JOIN RevenueMetrics revm ON sm.SERIES_ID = revm.SERIES_ID
WHERE sm.episode_count > 0
ORDER BY Performance_Score DESC, Total_Viewership DESC;

-- RESULT: Comprehensive dashboard showing series performance, cost, and engagement
-- Critical for business decisions on content investment and contract renewals


-- ============================================================================
-- Q6) TOP-N query (LIMIT with ranking)
-- ============================================================================
-- BUSINESS QUESTION: Who are the top 5 most engaged viewers based on their
-- watch history and review activity, and what are their viewing preferences?

SELECT
    v.VIEWER_ID,
    CONCAT(v.FIRST_NAME, ' ', COALESCE(v.LAST_NAME, '')) AS Viewer_Name,
    v.EMAIL,
    v.ROLE AS User_Role,
    COUNT(DISTINCT wh.EPISODE_ID) AS Episodes_Watched,
    ROUND(SUM(e.DURATION_MIN * wh.WATCH_PROGRESS / 100) / 60.0, 1) AS Hours_Watched,
    COUNT(DISTINCT f.FEEDBACK_ID) AS Reviews_Written,
    ROUND(AVG(f.RATING), 2) AS Avg_Rating_Given,
    COUNT(DISTINCT wh.SERIES_ID) AS Unique_Series_Watched,
    GROUP_CONCAT(DISTINCT s.NAME ORDER BY s.NAME SEPARATOR ', ') AS Series_Watched,
    -- Engagement Score: Weighted combination of watching and reviewing
    ROUND(
        (COUNT(DISTINCT wh.EPISODE_ID) * 1.0) +
        (COUNT(DISTINCT f.FEEDBACK_ID) * 3.0) +
        (COUNT(DISTINCT wh.SERIES_ID) * 2.0),
        2
    ) AS Engagement_Score,
    MAX(wh.LAST_WATCHED) AS Last_Active
FROM MSK_VIEWER v
LEFT JOIN MSK_WATCH_HISTORY wh ON v.VIEWER_ID = wh.VIEWER_ID
LEFT JOIN MSK_EPISODE e ON wh.EPISODE_ID = e.EPISODE_ID AND wh.SERIES_ID = e.SERIES_ID
LEFT JOIN MSK_FEEDBACK f ON v.VIEWER_ID = f.VIEWER_ID
LEFT JOIN MSK_WEB_SERIES s ON wh.SERIES_ID = s.SERIES_ID
GROUP BY v.VIEWER_ID, v.FIRST_NAME, v.LAST_NAME, v.EMAIL, v.ROLE
HAVING Episodes_Watched > 0 OR Reviews_Written > 0
ORDER BY Engagement_Score DESC, Hours_Watched DESC, Reviews_Written DESC
LIMIT 5;

-- RESULT: Identifies top 5 most valuable/engaged users on the platform
-- Useful for loyalty programs, beta testing, and understanding user behavior patterns


-- ============================================================================
-- BONUS: Additional Insights Query
-- ============================================================================
-- Series Genre Performance Analysis

SELECT
    st.TYPE_NAME AS Genre,
    COUNT(DISTINCT s.SERIES_ID) AS Series_Count,
    COUNT(DISTINCT e.EPISODE_ID) AS Total_Episodes,
    ROUND(AVG(f.RATING), 2) AS Avg_Genre_Rating,
    SUM(e.VIEWERS) AS Total_Genre_Viewership,
    ROUND(SUM(e.VIEWERS) / COUNT(DISTINCT s.SERIES_ID), 0) AS Avg_Viewership_Per_Series,
    COUNT(DISTINCT f.VIEWER_ID) AS Unique_Reviewers
FROM MSK_SERIES_TYPE st
INNER JOIN MSK_WEB_SERIES s ON st.SERIES_ID = s.SERIES_ID
LEFT JOIN MSK_EPISODE e ON s.SERIES_ID = e.SERIES_ID
LEFT JOIN MSK_FEEDBACK f ON s.SERIES_ID = f.SERIES_ID
GROUP BY st.TYPE_NAME
HAVING Series_Count > 0
ORDER BY Total_Genre_Viewership DESC, Avg_Genre_Rating DESC;

-- RESULT: Shows which genres perform best on the platform
-- Guides content acquisition strategy and helps understand viewer preferences
