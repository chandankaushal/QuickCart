require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DATABASE_USERNAME,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  options: "-c search_path=users", // ← set your schema here
});

module.exports = pool;
