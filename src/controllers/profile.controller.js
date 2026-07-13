const profileService = require('../services/profile.service');

const getProfile = async (req, res, next) => {
  try {
    const result = await profileService.getProfile(req.user.uid);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile };