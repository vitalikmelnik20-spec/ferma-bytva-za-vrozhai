require('dotenv').config();
const { Pool, types } = require('pg');

// Parse TIMESTAMP WITHOUT TIME ZONE as UTC (PG stores UTC; default pg behaviour
// wrongly treats the raw string as local time when process.env.TZ is set).
types.setTypeParser(1114, str => new Date(str + 'Z'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = { pool };
