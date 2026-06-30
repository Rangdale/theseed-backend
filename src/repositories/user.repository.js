const pool = require('../db/pool');

const findOrCreateUser = async ({ uid, email }) => {
  const result = await pool.query(
    `INSERT INTO users (id, email)
     VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET email = $2
     RETURNING *`,
    [uid, email]
  );
  return result.rows[0];
};

module.exports = { findOrCreateUser };