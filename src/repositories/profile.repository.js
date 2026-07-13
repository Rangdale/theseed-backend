const pool = require('../db/pool');

const getProfileData = async (userId) => {

  // User info
  const userResult = await pool.query(
    `SELECT id, email, display_name, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  // Total habits ever created (including soft deleted)
  const totalHabitsResult = await pool.query(
    `SELECT COUNT(*) AS total_habits
     FROM habits WHERE user_id = $1`,
    [userId]
  );

  // Total completions all time
  const totalCompletionsResult = await pool.query(
    `SELECT COUNT(*) AS total_completions
     FROM habit_completions WHERE user_id = $1`,
    [userId]
  );

  // Longest streak all time across all habits
  const longestStreakResult = await pool.query(
    `WITH streaks AS (
       SELECT
         habit_id,
         completion_date,
         completion_date - ROW_NUMBER() OVER (
           PARTITION BY habit_id ORDER BY completion_date
         )::integer AS streak_group
       FROM habit_completions
       WHERE user_id = $1
     ),
     streak_lengths AS (
       SELECT COUNT(*) AS streak_length
       FROM streaks
       GROUP BY habit_id, streak_group
     )
     SELECT COALESCE(MAX(streak_length), 0) AS longest_streak
     FROM streak_lengths`,
    [userId]
  );

  // Latest discipline score
  const scoreResult = await pool.query(
    `SELECT score, score_date
     FROM discipline_scores
     WHERE user_id = $1
     ORDER BY score_date DESC
     LIMIT 1`,
    [userId]
  );

  // Most consistent habit (highest completion rate, min 3 completions)
  const mostConsistentResult = await pool.query(
    `SELECT
       h.title,
       COUNT(hc.id) AS completions,
       EXTRACT(DAY FROM NOW() - h.created_at)::integer AS days_since_created
     FROM habits h
     LEFT JOIN habit_completions hc ON hc.habit_id = h.id
     WHERE h.user_id = $1
       AND h.frequency = 'daily'
     GROUP BY h.id, h.title, h.created_at
     HAVING COUNT(hc.id) >= 3
     ORDER BY
       COUNT(hc.id)::float /
       NULLIF(EXTRACT(DAY FROM NOW() - h.created_at)::integer, 0) DESC
     LIMIT 1`,
    [userId]
  );

  // Best month (month with most completions)
  const bestMonthResult = await pool.query(
    `SELECT
       TO_CHAR(completion_date, 'Month YYYY') AS month_label,
       COUNT(*) AS completions
     FROM habit_completions
     WHERE user_id = $1
     GROUP BY TO_CHAR(completion_date, 'Month YYYY'),
              DATE_TRUNC('month', completion_date)
     ORDER BY completions DESC
     LIMIT 1`,
    [userId]
  );

  return {
    user: userResult.rows[0],
    totalHabits: parseInt(totalHabitsResult.rows[0]?.total_habits || 0),
    totalCompletions: parseInt(totalCompletionsResult.rows[0]?.total_completions || 0),
    longestStreak: parseInt(longestStreakResult.rows[0]?.longest_streak || 0),
    score: scoreResult.rows[0] ? Math.round(parseFloat(scoreResult.rows[0].score)) : 0,
    mostConsistentHabit: mostConsistentResult.rows[0]?.title || null,
    bestMonth: bestMonthResult.rows[0]?.month_label?.trim() || null
  };
};

module.exports = { getProfileData };