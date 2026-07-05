const disciplineScoreService = require('../services/discipline-score.service');

const calculate = async (req, res, next) => {
  try {
    const result = await disciplineScoreService.calculateAndSave(req.user.uid);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getCurrent = async (req, res, next) => {
  try {
    const result = await disciplineScoreService.getCurrentScore(req.user.uid);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await disciplineScoreService.getScoreHistory(req.user.uid, days);
    res.json({ history: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { calculate, getCurrent, getHistory };