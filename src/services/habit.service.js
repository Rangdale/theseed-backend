const habitRepository = require('../repositories/habit.repository');

const VALID_CATEGORIES = ['wellness', 'productivity', 'fitness', 'mindfulness', 'learning', 'nutrition', 'social', 'deep_work', 'other'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_FREQUENCIES = ['daily', 'weekly'];

const validateHabitInput = ({ title, category, difficulty, frequency }) => {
  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (title && title.length > 255) {
    errors.push('Title must be under 255 characters');
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push(`Difficulty must be one of: ${VALID_DIFFICULTIES.join(', ')}`);
  }
  if (frequency && !VALID_FREQUENCIES.includes(frequency)) {
    errors.push(`Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`);
  }

  return errors;
};

const createHabit = async (userId, habitData) => {
  const errors = validateHabitInput(habitData);
  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.statusCode = 400;
    throw error;
  }

  return habitRepository.createHabit({
    userId,
    title: habitData.title.trim(),
    category: habitData.category || 'other',
    difficulty: habitData.difficulty || 'medium',
    frequency: habitData.frequency || 'daily',
    reminderTime: habitData.reminderTime || null
  });
};

const getHabits = async (userId) => {
  return habitRepository.getHabitsByUser(userId);
};

const getHabit = async (habitId, userId) => {
  const habit = await habitRepository.getHabitById(habitId, userId);
  if (!habit) {
    const error = new Error('Habit not found');
    error.statusCode = 404;
    throw error;
  }
  return habit;
};

const updateHabit = async (habitId, userId, habitData) => {
  // Only validate fields that were actually provided
  const errors = validateHabitInput({ title: habitData.title || 'placeholder', ...habitData });
  if (errors.length > 0) {
    const error = new Error(errors.join('; '));
    error.statusCode = 400;
    throw error;
  }

  const allowedFields = ['title', 'category', 'difficulty', 'frequency', 'reminder_time'];
  const fields = {};
  for (const key of allowedFields) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    if (habitData[camelKey] !== undefined) {
      fields[key] = habitData[camelKey];
    }
  }

  if (Object.keys(fields).length === 0) {
    const error = new Error('No valid fields to update');
    error.statusCode = 400;
    throw error;
  }

  const updated = await habitRepository.updateHabit(habitId, userId, fields);
  if (!updated) {
    const error = new Error('Habit not found');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

const deleteHabit = async (habitId, userId) => {
  const deleted = await habitRepository.softDeleteHabit(habitId, userId);
  if (!deleted) {
    const error = new Error('Habit not found');
    error.statusCode = 404;
    throw error;
  }
  return deleted;
};

module.exports = { createHabit, getHabits, getHabit, updateHabit, deleteHabit };