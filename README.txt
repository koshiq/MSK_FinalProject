Requirements

Before running this project, install the following:

    1. Node.js
    Download: https://nodejs.org/en/download

    2. MySQL Community Server
    Download: https://dev.mysql.com/downloads/mysql/

Install project dependencies: 
Run npm install (this will install the required libraries to run)

Configure evnironment variables through the .env 

Create the database:

Log into MySQL:
    mysql -u root -p
Create a database:
    CREATE DATABASE msk_finalproject;

Run the Server:
   Standard mode: npm start
   Server will start on: http://localhost:3001 unless otherwise defined in .env

Test Database Connection:
    Once the server is running go to http://localhost:3001/test-db
    Expected output: 
        {
            "success": true,
            "result": 2
        }

