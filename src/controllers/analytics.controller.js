const analyticsService = require('../services/analytics.service');

const getAnalytics = async (req, res, next) => {
  try {
    const period = req.query.period === 'monthly' ? 'monthly' : 'weekly';
    const result = await analyticsService.getAnalytics(req.user.uid, period);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };