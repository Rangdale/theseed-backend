const pool = require('../db/pool');

const markComplete = async ({ habitId, userId }) => {
  const result = await pool.query(
    `INSERT INTO habit_completions (habit_id, user_id, completion_date)
     VALUES ($1, $2, (NOW() AT TIME ZONE 'Asia/Kolkata')::date)
     ON CONFLICT (habit_id, completion_date) DO NOTHING
     RETURNING *`,
    [habitId, userId]
  );
  return result.rows[0] || null;
};

const markIncomplete = async ({ habitId, userId }) => {
  const result = await pool.query(
    `DELETE FROM habit_completions
     WHERE habit_id = $1
       AND user_id = $2
       AND completion_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
     RETURNING id`,
    [habitId, userId]
  );
  return result.rows[0] || null;
};

const getCompletionsForUser = async (userId, startDate, endDate) => {
  const result = await pool.query(
    `SELECT hc.*, h.title, h.category, h.difficulty
     FROM habit_completions hc
     JOIN habits h ON h.id = hc.habit_id
     WHERE hc.user_id = $1
       AND hc.completion_date BETWEEN $2 AND $3
     ORDER BY hc.completion_date DESC`,
    [userId, startDate, endDate]
  );
  return result.rows;
};

const getTodayCompletions = async (userId) => {
  const result = await pool.query(
    `SELECT habit_id FROM habit_completions
     WHERE user_id = $1
       AND completion_date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
    [userId]
  );
  return new Set(result.rows.map(r => r.habit_id));
};

const getStreakForHabit = async (habitId) => {
  const result = await pool.query(
    `SELECT completion_date
     FROM habit_completions
     WHERE habit_id = $1
     ORDER BY completion_date DESC`,
    [habitId]
  );

  if (result.rows.length === 0) return 0;

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const row of result.rows) {
    const date = new Date(row.completion_date);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.round((current - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      streak++;
      current = date;
    } else {
      break;
    }
  }

  return streak;
};

module.exports = {
  markComplete,
  markIncomplete,
  getCompletionsForUser,
  getTodayCompletions,
  getStreakForHabit
};