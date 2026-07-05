const homeService = require('../services/home.service');

const getDashboard = async (req, res, next) => {
  try {
    const data = await homeService.getDashboardData(req.user.uid);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };