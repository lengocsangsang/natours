const express = require('express');
const bookingController = require('../controllers/bookingController.js');
const authController = require('../controllers/authController.js');
const router = express.Router();

router.use(authController.protect);

router.get(
  '/checkout-session/:tourID', // tourID or tourId matters // watch it in controller function
  authController.protect,
  bookingController.getCheckoutSession,
);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
