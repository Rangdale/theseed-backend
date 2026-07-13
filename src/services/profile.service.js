const profileRepository = require('../repositories/profile.repository');

const GROWTH_STAGES = [
  { min: 0,  max: 24,  stage: 'Seed',   level: 0 },
  { min: 25, max: 49,  stage: 'Sprout', level: 1 },
  { min: 50, max: 74,  stage: 'Plant',  level: 2 },
  { min: 75, max: 100, stage: 'Tree',   level: 3 }
];

const getGrowthStage = (score) =>
  GROWTH_STAGES.find(s => score >= s.min && score <= s.max) || GROWTH_STAGES[0];

const getProfile = async (userId) => {
  const data = await profileRepository.getProfileData(userId);

  const growthStage = getGrowthStage(data.score);

  // Derive display name from email if not set
  const displayName = data.user?.display_name
    || data.user?.email?.split('@')[0]
    || 'User';

  // Format member since date
  const memberSince = data.user?.created_at
    ? new Date(data.user.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      })
    : null;

  return {
    displayName,
    email: data.user?.email || '',
    memberSince,
    totalHabits: data.totalHabits,
    totalCompletions: data.totalCompletions,
    longestStreak: data.longestStreak,
    disciplineScore: data.score,
    growthStage: growthStage.stage,
    growthLevel: growthStage.level,
    mostConsistentHabit: data.mostConsistentHabit,
    bestMonth: data.bestMonth
  };
};

module.exports = { getProfile };