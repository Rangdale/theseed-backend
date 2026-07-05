const pool = require('../db/pool');

const getDashboardData = async (userId) => {

  // Today's habits with completion status
  const habitsResult = await pool.query(
    `SELECT
       h.id,
       h.title,
       h.category,
       h.difficulty,
       h.frequency,
       CASE WHEN hc.id IS NOT NULL THEN true ELSE false END AS completed_today
     FROM habits h
     LEFT JOIN habit_completions hc
       ON hc.habit_id = h.id
       AND hc.completion_date = CURRENT_DATE
       AND hc.user_id = $1
     WHERE h.user_id = $1
       AND h.is_active = true
     ORDER BY h.created_at ASC`,
    [userId]
  );

  // Weekly completion data (last 7 days, one value per day)
  const weeklyResult = await pool.query(
    `SELECT
       d.day_date,
       COUNT(hc.id) AS completed,
       (SELECT COUNT(*) FROM habits
        WHERE user_id = $1 AND is_active = true AND frequency = 'daily') AS total_habits
     FROM generate_series(
       CURRENT_DATE - INTERVAL '6 days',
       CURRENT_DATE,
       INTERVAL '1 day'
     ) AS d(day_date)
     LEFT JOIN habit_completions hc
       ON hc.completion_date = d.day_date::date
       AND hc.user_id = $1
     GROUP BY d.day_date
     ORDER BY d.day_date ASC`,
    [userId]
  );

  // Overall current streak (longest active streak across all habits)
  const streakResult = await pool.query(
    `SELECT COALESCE(MAX(streak), 0) AS current_streak
     FROM (
       SELECT
         habit_id,
         COUNT(*) AS streak
       FROM (
         SELECT
           habit_id,
           completion_date,
           completion_date - ROW_NUMBER() OVER (
             PARTITION BY habit_id ORDER BY completion_date
           )::integer AS streak_group
         FROM habit_completions
         WHERE user_id = $1
       ) grouped
       WHERE completion_date >= CURRENT_DATE - INTERVAL '60 days'
       GROUP BY habit_id, streak_group
       HAVING MAX(completion_date) >= CURRENT_DATE - INTERVAL '1 day'
     ) streaks`,
    [userId]
  );

  // Growth grid — last 5 weeks (35 days), completions per day normalized 0-4
  const gridResult = await pool.query(
    `SELECT
       d.day_date::date AS date,
       COUNT(hc.id) AS completions,
       (SELECT COUNT(*) FROM habits
        WHERE user_id = $1 AND is_active = true) AS total_habits
     FROM generate_series(
       CURRENT_DATE - INTERVAL '34 days',
       CURRENT_DATE,
       INTERVAL '1 day'
     ) AS d(day_date)
     LEFT JOIN habit_completions hc
       ON hc.completion_date = d.day_date::date
       AND hc.user_id = $1
     GROUP BY d.day_date
     ORDER BY d.day_date ASC`,
    [userId]
  );

  // User display name
  const userResult = await pool.query(
    `SELECT display_name, email FROM users WHERE id = $1`,
    [userId]
  );

  return {
    habits: habitsResult.rows,
    weekly: weeklyResult.rows,
    currentStreak: parseInt(streakResult.rows[0]?.current_streak || 0),
    grid: gridResult.rows,
    user: userResult.rows[0]
  };
};

module.exports = { getDashboardData };