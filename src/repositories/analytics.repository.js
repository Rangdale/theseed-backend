const pool = require('../db/pool');

const getAnalyticsData = async (userId, period) => {
  const days = period === 'monthly' ? 30 : 7;
  const prevDays = days * 2;

  // Consistency trend — one data point per day
  const trendResult = await pool.query(
    `SELECT
       d.day_date::date AS date,
       COUNT(hc.id) AS completed,
       (SELECT COUNT(*) FROM habits
        WHERE user_id = $1
          AND is_active = true
          AND frequency = 'daily') AS total_habits
     FROM generate_series(
       CURRENT_DATE - ($2 - 1) * INTERVAL '1 day',
       CURRENT_DATE,
       INTERVAL '1 day'
     ) AS d(day_date)
     LEFT JOIN habit_completions hc
       ON hc.completion_date = d.day_date::date
       AND hc.user_id = $1
     GROUP BY d.day_date
     ORDER BY d.day_date ASC`,
    [userId, days]
  );

  // Current period completion rate
  const currentRateResult = await pool.query(
    `SELECT
       COUNT(hc.id) AS completed,
       COUNT(DISTINCT h.id) * $2 AS total_possible
     FROM habits h
     LEFT JOIN habit_completions hc
       ON hc.habit_id = h.id
       AND hc.completion_date >= CURRENT_DATE - ($2 - 1) * INTERVAL '1 day'
       AND hc.user_id = $1
     WHERE h.user_id = $1
       AND h.is_active = true
       AND h.frequency = 'daily'`,
    [userId, days]
  );

  // Previous period completion rate (for delta)
  const prevRateResult = await pool.query(
    `SELECT
       COUNT(hc.id) AS completed,
       COUNT(DISTINCT h.id) * $2 AS total_possible
     FROM habits h
     LEFT JOIN habit_completions hc
       ON hc.habit_id = h.id
       AND hc.completion_date >= CURRENT_DATE - ($3 - 1) * INTERVAL '1 day'
       AND hc.completion_date < CURRENT_DATE - ($2 - 1) * INTERVAL '1 day'
       AND hc.user_id = $1
     WHERE h.user_id = $1
       AND h.is_active = true
       AND h.frequency = 'daily'`,
    [userId, days, prevDays]
  );

  // Streak data
  const streakResult = await pool.query(
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
       SELECT habit_id, COUNT(*) AS streak_length
       FROM streaks
       GROUP BY habit_id, streak_group
     )
     SELECT
       MAX(streak_length) AS longest_streak,
       (SELECT COUNT(*) FROM habit_completions
        WHERE user_id = $1
          AND completion_date >= CURRENT_DATE - INTERVAL '30 days') AS recent_completions
     FROM streak_lengths`,
    [userId]
  );

  // Current streak
  const currentStreakResult = await pool.query(
    `WITH streaks AS (
       SELECT
         completion_date,
         completion_date - ROW_NUMBER() OVER (ORDER BY completion_date)::integer AS streak_group
       FROM (
         SELECT DISTINCT completion_date
         FROM habit_completions
         WHERE user_id = $1
       ) dates
     )
     SELECT COUNT(*) AS current_streak
     FROM streaks
     WHERE streak_group = (
       SELECT streak_group FROM streaks
       WHERE completion_date = (
         SELECT MAX(completion_date)
         FROM habit_completions
         WHERE user_id = $1
           AND completion_date >= CURRENT_DATE - INTERVAL '1 day'
       )
     )`,
    [userId]
  );

  // Best habit
  const bestHabitResult = await pool.query(
    `SELECT
       h.title,
       COUNT(hc.id) AS completed,
       $2 AS total_possible
     FROM habits h
     LEFT JOIN habit_completions hc
       ON hc.habit_id = h.id
       AND hc.completion_date >= CURRENT_DATE - ($2 - 1) * INTERVAL '1 day'
     WHERE h.user_id = $1
       AND h.is_active = true
     GROUP BY h.id, h.title
     ORDER BY completed DESC
     LIMIT 1`,
    [userId, days]
  );

  // Peak performance times
  const peakTimesResult = await pool.query(
    `SELECT
       CASE
         WHEN EXTRACT(HOUR FROM completed_at) BETWEEN 5 AND 11 THEN 'Morning'
         WHEN EXTRACT(HOUR FROM completed_at) BETWEEN 12 AND 16 THEN 'Afternoon'
         WHEN EXTRACT(HOUR FROM completed_at) BETWEEN 17 AND 21 THEN 'Evening'
         ELSE 'Night'
       END AS time_of_day,
       COUNT(*) AS completions
     FROM habit_completions
     WHERE user_id = $1
       AND completion_date >= CURRENT_DATE - ($2 - 1) * INTERVAL '1 day'
     GROUP BY time_of_day
     ORDER BY completions DESC`,
    [userId, days]
  );

  // Deep work hours
  const deepWorkResult = await pool.query(
    `SELECT
       COALESCE(SUM(h.duration_minutes), 0) AS total_minutes
     FROM habit_completions hc
     JOIN habits h ON h.id = hc.habit_id
     WHERE hc.user_id = $1
       AND h.category = 'deep_work'
       AND hc.completion_date >= CURRENT_DATE - ($2 - 1) * INTERVAL '1 day'`,
    [userId, days]
  );

  // Latest discipline score
  const scoreResult = await pool.query(
    `SELECT score, consistency_score, streak_stability
     FROM discipline_scores
     WHERE user_id = $1
     ORDER BY score_date DESC
     LIMIT 1`,
    [userId]
  );

  return {
    trend: trendResult.rows,
    currentRate: currentRateResult.rows[0],
    prevRate: prevRateResult.rows[0],
    streakData: streakResult.rows[0],
    currentStreak: currentStreakResult.rows[0],
    bestHabit: bestHabitResult.rows[0],
    peakTimes: peakTimesResult.rows,
    deepWork: deepWorkResult.rows[0],
    score: scoreResult.rows[0]
  };
};

module.exports = { getAnalyticsData };