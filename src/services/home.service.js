const homeRepository = require('../repositories/home.repository');

const getDashboardData = async (userId) => {
  const data = await homeRepository.getDashboardData(userId);

  // Normalize weekly data to 0-1 completion ratios
  const weekly = data.weekly.map(row => ({
    date: row.day_date,
    ratio: row.total_habits > 0
      ? Math.min(row.completed / row.total_habits, 1)
      : 0,
    completed: parseInt(row.completed),
    total: parseInt(row.total_habits)
  }));

  // Normalize grid data to levels 0-4
  const grid = data.grid.map(row => {
    const total = parseInt(row.total_habits);
    const completed = parseInt(row.completions);
    if (total === 0) return { date: row.date, level: 0 };
    const ratio = completed / total;
    if (ratio === 0) return { date: row.date, level: 0 };
    if (ratio <= 0.25) return { date: row.date, level: 1 };
    if (ratio <= 0.50) return { date: row.date, level: 2 };
    if (ratio <= 0.75) return { date: row.date, level: 3 };
    return { date: row.date, level: 4 };
  });

  // Format today's habits
  const todayHabits = data.habits.map(h => ({
    id: h.id,
    title: h.title,
    category: h.category,
    difficulty: h.difficulty,
    completedToday: h.completed_today
  }));

  const completedCount = todayHabits.filter(h => h.completedToday).length;

  // Display name: use stored name, or derive from email
  const displayName = data.user?.display_name
    || data.user?.email?.split('@')[0]
    || 'there';

  return {
    displayName,
    currentStreak: data.currentStreak,
    weekly,
    grid,
    todayHabits,
    completedToday: completedCount,
    totalHabits: todayHabits.length
  };
};

module.exports = { getDashboardData };