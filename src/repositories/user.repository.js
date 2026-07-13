const pool = require('../db/pool');

const findOrCreateUser = async ({ uid, email, displayName, photoUrl }) => {
  const result = await pool.query(
    `INSERT INTO users (id, email, display_name, photo_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       email = $2,
       display_name = $3,
       photo_url = $4
     RETURNING *`,
    [uid, email, displayName || null, photoUrl || null]
  );
  return result.rows[0];
};

module.exports = { findOrCreateUser };