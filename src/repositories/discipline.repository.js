const pool = require('../db/pool');

// Completion rate over last N days
const getCompletionRate = async (userId, days = 7) => {
  const result = await pool.query(
    `SELECT
       COUNT(DISTINCT hc.id) AS completed_count,
       COUNT(DISTINCT h.id) * $2 AS total_possible
     FROM habits h
     LEFT JOIN habit_completions hc
       ON hc.habit_id = h.id
       AND hc.user_id = $1
       AND hc.completion_date >= CURRENT_DATE - INTERVAL '1 day' * $2
     WHERE h.user_id = $1
       AND h.is_active = true
       AND h.frequency = 'daily'`,
    [userId, days]
  );

  const { completed_count, total_possible } = result.rows[0];
  if (total_possible === 0) return 0;
  return Math.min((completed_count / total_possible) * 100, 100);
};

// Streak stability — average (current_streak / max_streak) per habit
const getStreakStability = async (userId) => {
  const result = await pool.query(
    `WITH streak_data AS (
       SELECT
         habit_id,
         completion_date,
         completion_date - (ROW_NUMBER() OVER (
           PARTITION BY habit_id ORDER BY completion_date
         ) * INTERVAL '1 day')::date AS streak_group
       FROM habit_completions
       WHERE user_id = $1
     ),
     streak_lengths AS (
       SELECT
         habit_id,
         COUNT(*) AS streak_length
       FROM streak_data
       GROUP BY habit_id, streak_group
     ),
     habit_streaks AS (
       SELECT
         habit_id,
         MAX(streak_length) AS max_streak,
         (SELECT COUNT(*) FROM habit_completions hc2
          WHERE hc2.habit_id = streak_lengths.habit_id
            AND hc2.completion_date >= CURRENT_DATE - INTERVAL '30 days') AS recent_completions
       FROM streak_lengths
       GROUP BY habit_id
     )
     SELECT AVG(
       LEAST(recent_completions::float / GREATEST(max_streak, 1), 1) * 100
     ) AS stability
     FROM habit_streaks`,
    [userId]
  );

  return parseFloat(result.rows[0]?.stability || 0);
};

// Difficulty-weighted completion rate
const getDifficultyScore = async (userId, days = 7) => {
  const result = await pool.query(
    `SELECT
       h.difficulty,
       COUNT(hc.id) AS completed,
       COUNT(DISTINCT h.id) * $2 AS possible
     FROM habits h
     LEFT JOIN habit_completions hc
       ON hc.habit_id = h.id
       AND hc.completion_date >= CURRENT_DATE - INTERVAL '1 day' * $2
     WHERE h.user_id = $1
       AND h.is_active = true
       AND h.frequency = 'daily'
     GROUP BY h.difficulty`,
    [userId, days]
  );

  if (result.rows.length === 0) return 0;

  const weights = { easy: 1, medium: 1.5, hard: 2 };
  let weightedSum = 0;
  let totalWeight = 0;

  result.rows.forEach(row => {
    const weight = weights[row.difficulty] || 1;
    const rate = row.possible > 0
      ? Math.min(row.completed / row.possible, 1)
      : 0;
    weightedSum += rate * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
};

// Consistency trend — this week vs last week
const getConsistencyTrend = async (userId) => {
  const result = await pool.query(
    `SELECT
       SUM(CASE WHEN completion_date >= CURRENT_DATE - INTERVAL '7 days'
           THEN 1 ELSE 0 END) AS this_week,
       SUM(CASE WHEN completion_date >= CURRENT_DATE - INTERVAL '14 days'
           AND completion_date < CURRENT_DATE - INTERVAL '7 days'
           THEN 1 ELSE 0 END) AS last_week
     FROM habit_completions
     WHERE user_id = $1
       AND completion_date >= CURRENT_DATE - INTERVAL '14 days'`,
    [userId]
  );

  const { this_week, last_week } = result.rows[0];

  // If no history at all, neutral score
  if (last_week === 0 && this_week === 0) return 50;

  // If no last week data but has this week, positive trend
  if (last_week === 0) return 75;

  // Trend score: 50 = neutral, > 50 = improving, < 50 = declining
  const ratio = this_week / last_week;
  return Math.min(Math.max(ratio * 50, 0), 100);
};

// Save computed score as daily snapshot
const saveScore = async (userId, {
  score,
  consistencyScore,
  streakStability,
  completionRate
}) => {
  const result = await pool.query(
    `INSERT INTO discipline_scores
       (user_id, score, consistency_score, streak_stability, completion_rate, score_date)
     VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
     ON CONFLICT (user_id, score_date)
     DO UPDATE SET
       score = $2,
       consistency_score = $3,
       streak_stability = $4,
       completion_rate = $5,
       calculated_at = current_timestamp
     RETURNING *`,
    [userId, score, consistencyScore, streakStability, completionRate]
  );
  return result.rows[0];
};

// Get latest score for a user
const getLatestScore = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM discipline_scores
     WHERE user_id = $1
     ORDER BY score_date DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

// Get score history for trend chart
const getScoreHistory = async (userId, days = 30) => {
  const result = await pool.query(
    `SELECT score, consistency_score, score_date
     FROM discipline_scores
     WHERE user_id = $1
       AND score_date >= CURRENT_DATE - INTERVAL '1 day' * $2
     ORDER BY score_date ASC`,
    [userId, days]
  );
  return result.rows;
};

module.exports = {
  getCompletionRate,
  getStreakStability,
  getDifficultyScore,
  getConsistencyTrend,
  saveScore,
  getLatestScore,
  getScoreHistory
};