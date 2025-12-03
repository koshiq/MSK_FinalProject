# MSK+ Streaming Platform

An Apple TV+ inspired streaming platform with MySQL backend. Built with Express.js, MySQL, and vanilla JavaScript.

## Features

- **Apple TV+ Inspired UI**: Beautiful, modern interface with smooth animations
- **User Authentication**: Secure login and registration with JWT tokens
- **Series Management**: Browse, search, and filter web series
- **Episode Tracking**: Continue watching feature that remembers your progress
- **Reviews & Ratings**: Users can rate and review series
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- Node.js & Express.js
- MySQL 8.0+
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- Vanilla JavaScript (ES6+)
- CSS3 with custom properties
- Responsive design

## Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- Git

## Installation

### 1. Clone the repository

```bash
cd MSK_ProjectB
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up MySQL database

Make sure MySQL is running, then execute:

```bash
# Login to MySQL
mysql -u root -p

# Create the database and import schema
source schema.sql

# Import sample data
source sample_data.sql
```

Or use the npm script (if configured):

```bash
npm run setup-db
```

### 4. Configure environment variables

The `.env` file is already configured with:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=HoSaiyan6693!
DB_NAME=streaming_platform
DB_PORT=3306
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_msk_project_2024
JWT_EXPIRE=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:5500
```

**Important**: Update `DB_PASSWORD` if your MySQL root password is different.

### 5. Start the server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on [http://localhost:3001](http://localhost:3001)

## Usage

### Default Test Account

You can use these credentials to test the application:

- **Email**: john.doe@example.com
- **Password**: password123

Or create a new account through the registration form.

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

#### Series
- `GET /api/series` - Get all series
- `GET /api/series/:id` - Get series by ID
- `GET /api/series/featured` - Get featured/trending series
- `GET /api/series/genre/:genre` - Get series by genre
- `GET /api/series/search?q=query` - Search series

#### Episodes
- `GET /api/episodes/:id` - Get episode by ID
- `GET /api/episodes/series/:seriesId` - Get episodes by series
- `POST /api/episodes/:episodeId/:seriesId/progress` - Update watch progress (requires auth)
- `GET /api/episodes/continue/watching` - Get continue watching list (requires auth)

#### Feedback
- `POST /api/feedback` - Add feedback (requires auth)
- `GET /api/feedback/series/:seriesId` - Get feedback for series
- `GET /api/feedback/my` - Get user's feedback (requires auth)

## Database Schema

The application uses the following main tables:

- **MSK_WEB_SERIES** - Web series information
- **MSK_EPISODE** - Episode details
- **MSK_VIEWER** - User accounts
- **MSK_FEEDBACK** - User reviews and ratings
- **MSK_WATCH_HISTORY** - Continue watching tracking
- **MSK_PROD_HOUSE** - Production houses
- **MSK_PRODUCER** - Producers
- **MSK_CONTRACTS** - Contracts between production houses and series
- **MSK_SERIES_TYPE** - Series genres
- **MSK_SERIES_DUBBING** - Dubbing languages
- **MSK_SERIES_SUBTITLE** - Subtitle languages

See [schema.sql](schema.sql) for complete schema definition.

## Project Structure

```
MSK_ProjectB/
├── server/
│   ├── config/
│   │   └── database.js          # MySQL connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── seriesController.js  # Series management
│   │   ├── episodeController.js # Episode management
│   │   └── feedbackController.js# Reviews/ratings
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── series.js            # Series routes
│   │   ├── episodes.js          # Episode routes
│   │   └── feedback.js          # Feedback routes
│   └── server.js                # Express server
├── public/
│   ├── css/
│   │   └── style.css            # Apple TV+ inspired styles
│   ├── js/
│   │   └── app.js               # Frontend JavaScript
│   └── index.html               # Main HTML file
├── schema.sql                   # Database schema
├── sample_data.sql              # Sample data
├── .env                         # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Features Walkthrough

### 1. Browse Series
- View featured series in the hero section
- Browse by categories (Drama, Sci-Fi, etc.)
- Trending section shows most-viewed series

### 2. Search
- Real-time search functionality
- Search by series name or description

### 3. Series Details
- Click on any series to view details
- See all episodes, ratings, and reviews
- Play episodes (requires login)

### 4. Continue Watching
- Automatically tracks your viewing progress
- Resume from where you left off
- Only visible when logged in

### 5. User Authentication
- Secure registration and login
- JWT-based authentication
- Password hashing with bcrypt

### 6. Reviews & Ratings
- Rate series from 1-5 stars
- Write text reviews
- View other users' reviews

## Development

### Adding New Features

1. **Backend**: Add controllers in `server/controllers/` and routes in `server/routes/`
2. **Frontend**: Update `public/js/app.js` and add styles in `public/css/style.css`
3. **Database**: Modify `schema.sql` and update sample data

### Environment Variables

All sensitive configuration should be in `.env`:
- Database credentials
- JWT secret
- Port numbers
- CORS origins

## Troubleshooting

### MySQL Connection Issues

If you get connection errors:

1. Verify MySQL is running:
   ```bash
   mysql -u root -p
   ```

2. Check credentials in `.env` match your MySQL setup

3. Ensure the database exists:
   ```sql
   SHOW DATABASES;
   ```

### Port Already in Use

If port 3001 is busy, change `PORT` in `.env`

### CORS Issues

Update `CORS_ORIGIN` in `.env` to match your frontend URL

## Future Enhancements

- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Advanced analytics

## License

MIT License

## Credits

Designed and developed for the MSK Streaming Platform project.
Inspired by Apple TV+ interface design.
