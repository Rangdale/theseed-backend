const disciplineRepository = require('../repositories/discipline.repository');

const WEIGHTS = {
  completionRate: 0.40,
  streakStability: 0.30,
  difficultyScore: 0.20,
  consistencyTrend: 0.10
};

const GROWTH_STAGES = [
  { min: 0,  max: 24,  stage: 'Seed',   level: 0 },
  { min: 25, max: 49,  stage: 'Sprout', level: 1 },
  { min: 50, max: 74,  stage: 'Plant',  level: 2 },
  { min: 75, max: 100, stage: 'Tree',   level: 3 }
];

const getGrowthStage = (score) => {
  return GROWTH_STAGES.find(s => score >= s.min && score <= s.max)
    || GROWTH_STAGES[0];
};

// Check if user has enough data to calculate a meaningful score
const getUserDataSummary = async (userId) => {
  const result = await disciplineRepository.getUserDataSummary(userId);
  return result;
};

const calculateAndSave = async (userId) => {
  // First check if user has any completions at all
  const summary = await getUserDataSummary(userId);

  // Not enough data — return honest zero state
  if (summary.total_completions === 0) {
    const zeroScore = {
      score: 0,
      consistencyScore: 0,
      streakStability: 0,
      completionRate: 0,
      consistencyTrend: 0,
      difficultyScore: 0,
      growthStage: 'Seed',
      growthLevel: 0
    };

    await disciplineRepository.saveScore(userId, {
      score: 0,
      consistencyScore: 0,
      streakStability: 0,
      completionRate: 0
    });

    return zeroScore;
  }

  // Run all four component queries in parallel
  const [
    completionRate,
    streakStability,
    difficultyScore,
    consistencyTrend
  ] = await Promise.all([
    disciplineRepository.getCompletionRate(userId),
    disciplineRepository.getStreakStability(userId),
    disciplineRepository.getDifficultyScore(userId),
    disciplineRepository.getConsistencyTrend(userId)
  ]);

  console.log('Score components:', {
    completionRate,
    streakStability,
    difficultyScore,
    consistencyTrend
  });

  const rawScore =
    (completionRate   * WEIGHTS.completionRate) +
    (streakStability  * WEIGHTS.streakStability) +
    (difficultyScore  * WEIGHTS.difficultyScore) +
    (consistencyTrend * WEIGHTS.consistencyTrend);

  const score = Math.min(Math.max(Math.round(rawScore), 0), 100);
  const growthStage = getGrowthStage(score);

  await disciplineRepository.saveScore(userId, {
    score,
    consistencyScore: Math.round(completionRate),
    streakStability: Math.round(streakStability),
    completionRate: Math.round(completionRate)
  });

  return {
    score,
    consistencyScore: Math.round(completionRate),
    streakStability: Math.round(streakStability),
    completionRate: Math.round(completionRate),
    consistencyTrend: Math.round(consistencyTrend),
    difficultyScore: Math.round(difficultyScore),
    growthStage: growthStage.stage,
    growthLevel: growthStage.level
  };
};

const getCurrentScore = async (userId) => {
  const snapshot = await disciplineRepository.getLatestScore(userId);

  if (!snapshot) {
    return {
      score: 0,
      consistencyScore: 0,
      streakStability: 0,
      completionRate: 0,
      growthStage: 'Seed',
      growthLevel: 0,
      scoreDate: null
    };
  }

  const growthStage = getGrowthStage(parseFloat(snapshot.score));

  return {
    score: Math.round(parseFloat(snapshot.score)),
    consistencyScore: Math.round(parseFloat(snapshot.consistency_score)),
    streakStability: Math.round(parseFloat(snapshot.streak_stability)),
    completionRate: Math.round(parseFloat(snapshot.completion_rate)),
    growthStage: growthStage.stage,
    growthLevel: growthStage.level,
    scoreDate: snapshot.score_date
  };
};

const getScoreHistory = async (userId, days = 30) => {
  const history = await disciplineRepository.getScoreHistory(userId, days);
  return history.map(row => ({
    score: Math.round(parseFloat(row.score)),
    consistencyScore: Math.round(parseFloat(row.consistency_score)),
    date: row.score_date
  }));
};

module.exports = { calculateAndSave, getCurrentScore, getScoreHistory };