// const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
// GET ALL REVIEWS
exports.getAllReviews = factory.getAll(Review);
// GET REVIEW
exports.getReview = factory.getOne(Review, {
  path: 'user',
  select: 'name photo',
});
// CREATE REVIEW
exports.createNewReview = factory.createOne(Review);
// DELETE REVIEW
exports.deleteReview = factory.deleteOne(Review);
// DO NOT UPDATE PASSWORD WITH THIS
exports.updateReview = factory.updateOne(Review);
