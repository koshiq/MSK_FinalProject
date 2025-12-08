//express server setup with database connection test route
//cors is used to handle cross-origin requests
//require dotenv to manage environment variables
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');

//initialize express app which is the main component of our server-handles routing and middleware
const app = express();

//middleware used to parse json data and handle cors issues
app.use(cors());
app.use(express.json());

//this will test route to verify our database connection
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({ success: true, result: rows[0].result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

//start the server on specified port or default to 3001 since 3000 is often used by frontend development servers
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
