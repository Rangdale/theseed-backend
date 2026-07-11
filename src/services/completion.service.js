const completionRepository = require('../repositories/completion.repository');
const habitRepository = require('../repositories/habit.repository');


const toggleCompletion = async (habitId, userId) => {
  const habit = await habitRepository.getHabitById(habitId, userId);
  if (!habit) {
    const error = new Error('Habit not found');
    error.statusCode = 404;
    throw error;
  }

  const completion = await completionRepository.markComplete({
    habitId,
    userId
  });

  if (completion) {
    return {
      completed: true,
      completionDate: completion.completion_date
    };
  } else {
    await completionRepository.markIncomplete({ habitId, userId });
    return {
      completed: false,
      completionDate: null
    };
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