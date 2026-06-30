const habitService = require('../services/habit.service');

const createHabit = async (req, res, next) => {
  try {
    const habit = await habitService.createHabit(req.user.uid, req.body);
    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
};

const getHabits = async (req, res, next) => {
  try {
    const habits = await habitService.getHabits(req.user.uid);
    res.json({ habits });
  } catch (error) {
    next(error);
  }
};

const getHabit = async (req, res, next) => {
  try {
    const habit = await habitService.getHabit(req.params.id, req.user.uid);
    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

const updateHabit = async (req, res, next) => {
  try {
    const habit = await habitService.updateHabit(req.params.id, req.user.uid, req.body);
    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

const deleteHabit = async (req, res, next) => {
  try {
    await habitService.deleteHabit(req.params.id, req.user.uid);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = { createHabit, getHabits, getHabit, updateHabit, deleteHabit };