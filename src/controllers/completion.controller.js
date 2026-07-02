const completionService = require('../services/completion.service');

const toggleCompletion = async (req, res, next) => {
  try {
    const result = await completionService.toggleCompletion(
      req.params.habitId,
      req.user.uid
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const result = await completionService.getTodayStatus(req.user.uid);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getHabitStreak = async (req, res, next) => {
  try {
    const result = await completionService.getHabitStreak(
      req.params.habitId,
      req.user.uid
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { toggleCompletion, getTodayStatus, getHabitStreak };