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
  // Get total days app has been used (days since first completion)
  const summaryResult = await pool.query(
    `SELECT
       COUNT(*) AS total_completions,
       COUNT(DISTINCT completion_date) AS active_days,
       MIN(completion_date) AS first_completion
     FROM habit_completions
     WHERE user_id = $1`,
    [userId]
  );

  const totalCompletions = parseInt(summaryResult.rows[0]?.total_completions || 0);
  const activeDays = parseInt(summaryResult.rows[0]?.active_days || 0);

  // Not enough data for meaningful stability
  if (totalCompletions < 3) return 0;

  const result = await pool.query(
    `WITH completions AS (
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
       SELECT
         habit_id,
         COUNT(*) AS streak_length
       FROM completions
       GROUP BY habit_id, streak_group
     ),
     habit_streaks AS (
       SELECT
         habit_id,
         MAX(streak_length) AS max_streak,
         COUNT(*) AS total_streaks
       FROM streak_lengths
       GROUP BY habit_id
     )
     SELECT
       AVG(
         -- Penalize for having many short streaks vs one long one
         max_streak::float / GREATEST(max_streak + total_streaks - 1, 1) * 100
       ) AS stability
     FROM habit_streaks`,
    [userId]
  );

  // Additionally penalize if user hasn't been consistent recently
  // active_days out of last 14 days
  const recentResult = await pool.query(
    `SELECT COUNT(DISTINCT completion_date) AS recent_days
     FROM habit_completions
     WHERE user_id = $1
       AND completion_date >= CURRENT_DATE - INTERVAL '14 days'`,
    [userId]
  );

  const recentDays = parseInt(recentResult.rows[0]?.recent_days || 0);
  const recencyFactor = Math.min(recentDays / 14, 1); // 0-1

  const rawStability = parseFloat(result.rows[0]?.stability || 0);

  // Blend formula stability with recency — both must be good for high score
  return rawStability * recencyFactor;
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
           THEN 1 ELSE 0 END) AS last_week,
       COUNT(DISTINCT completion_date) AS total_active_days
     FROM habit_completions
     WHERE user_id = $1
       AND completion_date >= CURRENT_DATE - INTERVAL '14 days'`,
    [userId]
  );

  const thisWeek = parseInt(result.rows[0]?.this_week || 0);
  const lastWeek = parseInt(result.rows[0]?.last_week || 0);
  const totalActiveDays = parseInt(result.rows[0]?.total_active_days || 0);

  // No data → 0
  if (thisWeek === 0 && lastWeek === 0) return 0;

  // Only this week data — score based on daily completion rate this week
  // Don't give a free 70, make them earn it
  if (lastWeek === 0) {
    const dayOfWeek = new Date().getDay() || 7; // 1 = Monday, 7 = Sunday
    // How many of the days so far this week did they complete habits?
    const dailyRate = thisWeek / dayOfWeek;
    return Math.min(dailyRate * 50, 50); // max 50 — can't be "improving" with no baseline
  }

  // Both weeks have data — compare honestly
  const ratio = thisWeek / lastWeek;
  // ratio 1.0 = same performance = 50
  // ratio 2.0 = twice as good = 100
  // ratio 0.5 = half as good = 25
  return Math.min(Math.max(ratio * 50, 0), 100);
};

const getUserDataSummary = async (userId) => {
  const result = await pool.query(
    `SELECT
       COUNT(*) AS total_completions,
       COUNT(DISTINCT completion_date) AS active_days,
       COUNT(DISTINCT habit_id) AS habits_with_completions,
       MIN(completion_date) AS first_completion,
       MAX(completion_date) AS last_completion
     FROM habit_completions
     WHERE user_id = $1`,
    [userId]
  );
  return {
    total_completions: parseInt(result.rows[0]?.total_completions || 0),
    active_days: parseInt(result.rows[0]?.active_days || 0),
    habits_with_completions: parseInt(result.rows[0]?.habits_with_completions || 0)
  };
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
  getUserDataSummary,
  saveScore,
  getLatestScore,
  getScoreHistory
};