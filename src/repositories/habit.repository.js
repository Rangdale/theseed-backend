const pool = require('../db/pool');

const createHabit = async ({ userId, title, category, difficulty, frequency, reminderTime, durationMinutes }) => {
  console.log('Repository createHabit called with durationMinutes:', durationMinutes);
  console.log('Full params:', [userId, title, category, difficulty, frequency, reminderTime, durationMinutes]);
  
  const result = await pool.query(
    `INSERT INTO habits (user_id, title, category, difficulty, frequency, reminder_time, duration_minutes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, title, category, difficulty, frequency, reminderTime, durationMinutes || null]
  );
  
  console.log('Inserted habit:', result.rows[0]);
  return result.rows[0];
};

const getHabitsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM habits
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getHabitById = async (habitId, userId) => {
  const result = await pool.query(
    `SELECT * FROM habits
     WHERE id = $1 AND user_id = $2 AND is_active = true`,
    [habitId, userId]
  );
  return result.rows[0] || null;
};

const updateHabit = async (habitId, userId, fields) => {
  // Build SET clause dynamically based on which fields were passed
  const keys = Object.keys(fields);
  const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');
  const values = keys.map((key) => fields[key]);

  const result = await pool.query(
    `UPDATE habits
     SET ${setClause}, updated_at = current_timestamp
     WHERE id = $1 AND user_id = $2 AND is_active = true
     RETURNING *`,
    [habitId, userId, ...values]
  );
  return result.rows[0] || null;
};

const softDeleteHabit = async (habitId, userId) => {
  const result = await pool.query(
    `UPDATE habits
     SET is_active = false, updated_at = current_timestamp
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [habitId, userId]
  );
  return result.rows[0] || null;
};

module.exports = {
  createHabit,
  getHabitsByUser,
  getHabitById,
  updateHabit,
  softDeleteHabit
};