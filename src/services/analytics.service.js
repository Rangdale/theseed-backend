const analyticsRepository = require('../repositories/analytics.repository');

const getAnalytics = async (userId, period = 'weekly') => {
  const data = await analyticsRepository.getAnalyticsData(userId, period);

  // Completion rate current period
  const currentCompleted = parseInt(data.currentRate?.completed || 0);
  const currentPossible = parseInt(data.currentRate?.total_possible || 0);
  const completionRate = currentPossible > 0
    ? Math.round((currentCompleted / currentPossible) * 100)
    : 0;

  // Completion rate previous period (for delta)
  const prevCompleted = parseInt(data.prevRate?.completed || 0);
  const prevPossible = parseInt(data.prevRate?.total_possible || 0);
  const prevCompletionRate = prevPossible > 0
    ? Math.round((prevCompleted / prevPossible) * 100)
    : 0;

  // Score
  const score = data.score ? Math.round(parseFloat(data.score.score)) : 0;
  const consistencyScore = data.score
    ? Math.round(parseFloat(data.score.consistency_score))
    : 0;
  const streakStabilityPct = data.score
    ? Math.round(parseFloat(data.score.streak_stability))
    : 0;

  // Streak
  const longestStreak = parseInt(data.streakData?.longest_streak || 0);
  const currentStreak = parseInt(data.currentStreak?.current_streak || 0);

  // Best habit
  const bestHabit = data.bestHabit
    ? {
        title: data.bestHabit.title,
        completionRate: data.bestHabit.total_possible > 0
          ? Math.round((data.bestHabit.completed / data.bestHabit.total_possible) * 100)
          : 0
      }
    : null;

  // Missed rate
  const missedRate = 100 - completionRate;

  // Deep work hours
  const deepWorkMinutes = parseInt(data.deepWork?.total_minutes || 0);
  const deepWorkHours = Math.round(deepWorkMinutes / 60 * 10) / 10; // 1 decimal

  // Peak times — normalize to 0-100 for bar chart
  const totalCompletions = data.peakTimes.reduce(
    (sum, t) => sum + parseInt(t.completions), 0
  );
  const peakTimes = ['Morning', 'Afternoon', 'Evening', 'Night'].map(slot => {
    const found = data.peakTimes.find(t => t.time_of_day === slot);
    const count = found ? parseInt(found.completions) : 0;
    return {
      label: slot,
      count,
      ratio: totalCompletions > 0 ? count / totalCompletions : 0
    };
  });

  // Consistency trend
  const trend = data.trend.map(row => ({
    date: row.date,
    ratio: parseInt(row.total_habits) > 0
      ? Math.min(parseInt(row.completed) / parseInt(row.total_habits), 1)
      : 0
  }));

  return {
    period,
    score,
    scoreDelta: score - prevCompletionRate, // rough delta
    consistencyScore,
    currentStreak,
    longestStreak,
    streakStability: streakStabilityPct,
    completionRate,
    missedRate,
    deepWorkHours,
    bestHabit,
    peakTimes,
    trend
  };
};

module.exports = { getAnalytics };