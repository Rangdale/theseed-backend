const completionRepository = require('../repositories/completion.repository');
const habitRepository = require('../repositories/habit.repository');

const getToday = () => {
  return new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
};

const toggleCompletion = async (habitId, userId) => {
  // Verify the habit belongs to this user before touching completions
  const habit = await habitRepository.getHabitById(habitId, userId);
  if (!habit) {
    const error = new Error('Habit not found');
    error.statusCode = 404;
    throw error;
  }

  const today = getToday();

  // Try to mark complete — returns null if already completed
  const completion = await completionRepository.markComplete({
    habitId,
    userId,
    completionDate: today
  });

  if (completion) {
    // Was not completed → now marked complete
    return { completed: true, completionDate: today };
  } else {
    // Was already completed → unmark it
    await completionRepository.markIncomplete({
      habitId,
      userId,
      completionDate: today
    });
    return { completed: false, completionDate: today };
  }
};

const getTodayStatus = async (userId) => {
  const completedHabitIds = await completionRepository.getTodayCompletions(userId);
  return { completedHabitIds: [...completedHabitIds] };
};

const getHabitStreak = async (habitId, userId) => {
  // Verify ownership first
  const habit = await habitRepository.getHabitById(habitId, userId);
  if (!habit) {
    const error = new Error('Habit not found');
    error.statusCode = 404;
    throw error;
  }

  const streak = await completionRepository.getStreakForHabit(habitId);
  return { habitId, streak };
};

module.exports = { toggleCompletion, getTodayStatus, getHabitStreak };