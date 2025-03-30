const express = require('express');
const viewController = require('../controllers/viewController.js');
const authController = require('../controllers/authController.js');
const bookingController = require('../controllers/bookingController.js');
const router = express.Router();

// SERVER LISTENS ON LOCALHOST:PORT - FOR API REQUEST TO END POINT: "/" - CALL VIEWCONTROLLER.GETOVERVIEW
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview,
);

// SERVER LISTENS ON LOCAHOST:PORT - FOR API REQUEST TO END POINT: "/tour:/slug" - PROTECT ROUTE - CALL VIEWCONTROLLER.GETTOUR
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

// SERVER LISTENS ON LOCAHOST:PORT - FOR API REQUEST TO END POINT: "/login" - CALL VIEWCONTROLLER.GETLOGINFORM
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/me', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyTours);

router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData,
);
// /login

module.exports = router;
