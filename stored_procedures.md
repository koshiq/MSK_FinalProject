# Stored Procedures Usage Guide

## Installation

To install all stored procedures, run:

```bash
mysql -u root -p streaming_platform < stored_procedures.sql
```

Or from MySQL prompt:
```sql
USE streaming_platform;
SOURCE stored_procedures.sql;
```

## Available Stored Procedures

### Series Management

#### 1. Create Series
```sql
CALL sp_create_series(
    'The Witcher',          -- p_name
    24,                     -- p_num_episodes
    '2019-12-20',          -- p_release_date
    'United States',        -- p_country
    '/images/witcher.jpg',  -- p_poster_url
    'Geralt of Rivia...',  -- p_description
    @new_series_id         -- OUT p_series_id
);
SELECT @new_series_id;
```

#### 2. Update Series
```sql
CALL sp_update_series(
    1,                      -- p_series_id
    'Stranger Things S5',   -- p_name
    50,                     -- p_num_episodes
    NULL,                   -- p_release_date (keep existing)
    NULL,                   -- p_country (keep existing)
    NULL,                   -- p_poster_url (keep existing)
    'New season coming...' -- p_description
);
```

#### 3. Delete Series
```sql
CALL sp_delete_series(7); -- Deletes series with ID 7
```

#### 4. Get Series Details
```sql
CALL sp_get_series_details(1); -- Returns 2 result sets: series info + episodes
```

#### 5. Get Featured Series
```sql
CALL sp_get_featured_series(6); -- Get top 6 trending series by views
```

#### 6. Search Series
```sql
CALL sp_search_series('stranger'); -- Search by name or description
```

#### 7. Get Series by Genre
```sql
CALL sp_get_series_by_genre('Sci-Fi'); -- Get all Sci-Fi series
```

### Episode Management

#### 1. Create Episode
```sql
CALL sp_create_episode(
    1,                      -- p_series_id
    6,                      -- p_episode_no
    'Chapter Six: The Monster', -- p_title
    52,                     -- p_duration
    @new_episode_id        -- OUT p_episode_id
);
SELECT @new_episode_id;
```

#### 2. Update Episode
```sql
CALL sp_update_episode(
    1,                          -- p_episode_id
    NULL,                       -- p_episode_no (keep existing)
    'Updated Episode Title',    -- p_title
    55                          -- p_duration
);
```

#### 3. Delete Episode
```sql
CALL sp_delete_episode(5); -- Deletes episode with ID 5
```

### Feedback/Review Management

#### 1. Add Feedback
```sql
CALL sp_add_feedback(
    3,                      -- p_viewer_id
    1,                      -- p_series_id
    4.5,                    -- p_rating (1-5)
    'Amazing show!',        -- p_text
    @new_feedback_id       -- OUT p_feedback_id
);
SELECT @new_feedback_id;
```

#### 2. Update Feedback
```sql
CALL sp_update_feedback(
    1,                      -- p_feedback_id
    5.0,                    -- p_rating
    'Updated review text'   -- p_text
);
```

#### 3. Delete Feedback
```sql
CALL sp_delete_feedback(3); -- Deletes feedback with ID 3
```

### Watch History Management

#### 1. Update Watch Progress
```sql
CALL sp_update_watch_progress(
    3,      -- p_viewer_id
    1,      -- p_episode_id
    1,      -- p_series_id
    45      -- p_progress (0-100%)
);
```

#### 2. Get Continue Watching
```sql
CALL sp_get_continue_watching(3, 10); -- Get 10 most recent items for viewer 3
```

### Analytics Procedures

#### 1. Get Top Rated Series
```sql
CALL sp_get_top_rated_series(5); -- Get top 5 rated series
```

#### 2. Get Most Viewed Episodes
```sql
CALL sp_get_most_viewed_episodes(10); -- Get top 10 most viewed episodes
```

## Using Stored Procedures in Node.js

### Example: Create Series
```javascript
const [result] = await connection.query(
    'CALL sp_create_series(?, ?, ?, ?, ?, ?, @series_id)',
    [name, numEpisodes, releaseDate, country, posterUrl, description]
);

// Get the OUT parameter
const [[{series_id}]] = await connection.query('SELECT @series_id as series_id');
console.log('New series ID:', series_id);
```

### Example: Get Series Details
```javascript
const [results] = await connection.query(
    'CALL sp_get_series_details(?)',
    [seriesId]
);

// results[0] = series info
// results[1] = episodes array
const seriesInfo = results[0][0];
const episodes = results[1];
```

### Example: Search Series
```javascript
const [results] = await connection.query(
    'CALL sp_search_series(?)',
    [searchTerm]
);

const series = results[0]; // Array of matching series
```

### Example: Update Watch Progress
```javascript
await connection.query(
    'CALL sp_update_watch_progress(?, ?, ?, ?)',
    [viewerId, episodeId, seriesId, progress]
);
```

## Benefits of Using Stored Procedures

1. **Performance**: Reduced network traffic, compiled once and cached
2. **Security**: Protection against SQL injection
3. **Maintainability**: Business logic centralized in database
4. **Consistency**: Same logic used across all applications
5. **Transaction Safety**: Built-in error handling with automatic rollback
6. **Encapsulation**: Hide complex queries behind simple interfaces

## Transaction Handling

All stored procedures include:
- **Automatic Transaction Management**: BEGIN/COMMIT/ROLLBACK
- **Error Handling**: EXIT HANDLER for SQLEXCEPTION
- **Automatic Rollback**: If any error occurs, changes are rolled back
- **ACID Compliance**: Ensures data integrity

## Example Error Handling

When a stored procedure fails:

```javascript
try {
    await connection.query('CALL sp_create_series(?, ?, ?, ?, ?, ?, @id)', params);
} catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
        console.error('Duplicate entry error');
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        console.error('Foreign key constraint violation');
    }
    // Transaction is automatically rolled back
}
```

## Testing Stored Procedures

### Test Create and Retrieve
```sql
-- Create a test series
CALL sp_create_series('Test Series', 10, '2024-01-01', 'USA', '/test.jpg', 'Test description', @id);
SELECT @id;

-- Retrieve it
CALL sp_get_series_details(@id);

-- Clean up
CALL sp_delete_series(@id);
```

### Test Transaction Rollback
```sql
-- This should fail due to duplicate name (if unique constraint exists)
CALL sp_create_series('Stranger Things', 42, '2016-07-15', 'USA', '/img.jpg', 'Duplicate', @id);
-- Transaction is automatically rolled back, no data is inserted
```

## View All Stored Procedures
```sql
SHOW PROCEDURE STATUS WHERE Db = 'streaming_platform';

-- View specific procedure code
SHOW CREATE PROCEDURE sp_create_series;
```

## Performance Considerations

1. **Indexing**: All foreign keys are indexed for optimal JOIN performance
2. **Query Optimization**: Procedures use optimized queries with proper JOINs
3. **Connection Pooling**: Use with Node.js connection pooling for best performance
4. **Caching**: MySQL caches stored procedure execution plans

## Migration from Direct Queries

To migrate your controllers to use stored procedures:

**Before (Direct Query):**
```javascript
const [result] = await connection.query(
    'INSERT INTO MSK_WEB_SERIES (NAME, ...) VALUES (?, ...)',
    [name, ...]
);
const seriesId = result.insertId;
```

**After (Stored Procedure):**
```javascript
await connection.query(
    'CALL sp_create_series(?, ?, ?, ?, ?, ?, @series_id)',
    [name, numEpisodes, releaseDate, country, posterUrl, description]
);
const [[{series_id}]] = await connection.query('SELECT @series_id as series_id');
```

## Troubleshooting

### Check if procedure exists
```sql
SELECT ROUTINE_NAME
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = 'streaming_platform'
  AND ROUTINE_TYPE = 'PROCEDURE';
```

### View procedure definition
```sql
SHOW CREATE PROCEDURE sp_create_series;
```

### Drop and recreate
```sql
DROP PROCEDURE IF EXISTS sp_create_series;
-- Then run the CREATE PROCEDURE statement again
```
