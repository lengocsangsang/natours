const Tour = require('../models/tourModels');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// GETOVERVIEW: GET ALL TOURS FROM MODEL - RENDER ALL TOURS
exports.getOverview = catchAsync(async (req, res, next) => {
  //1. GET TOUR DATA FROM COLLECTION
  const tours = await Tour.find();

  //2. BUILD TEMPLATE: DONE on PUG FILE
  //3. RENDER THAT TEMPLATE USING TOUR DATA FROM STEP 1.

  // res.status(200) tells Express to send HTTP status code 200 (OK)` in the response.
  res.status(200).render('overview', {
    tours,
  });
});
// .render('overview', { tours }) tells Express to
// 1. Look for a Pug file named overview.pug inside the views folder.
// 2. Pass the tours data into that template.
// 3. Convert the Pug template into an HTML file.
// 4. Send that HTML as the final response to the browser.

// GETTOUR: GET TOUR BY :SLUG - POPULATE WITH REVIEWS INFO - CREATE TITLE - PASS TITLE AND TOUR INFO TO tour.pug, CONVERT TO HTML AND SEND TO BROWSER
exports.getTour = catchAsync(async (req, res, next) => {
  // 1.GET THE DATA: REQUESTED TOUR (INCLUDING REVIEWS AND GUIDES)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }
  // 2. BUILD TEMPLATE
  // 3. RENDER TEMPLATE USING THE DATA FROM 1.

  res
    .status(200)
    // THIS IS TO DEAL WITH CSP
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://js.stripe.com;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self' https://js.stripe.com;img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;",
    ) // WHY THIS CAN SOLVE THE PROBLEM OF CSP FOR STRIPE???
    .render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
});

// GETLOGGINFORM: CREATE A TITLE - PASS TITLE INFO TO login.pug, CONVERT TO HTML AND SEND TO BROWSER
exports.getLoginForm = catchAsync(async (req, res, next) => {
  res
    .status(200)
    // TO DEAL WITH CSP
    .set(
      'Content-Security-Policy',
      "connect-src 'self' https://cdnjs.cloudflare.com http://localhost:8000 ws://localhost:50027;",
    )
    .render('login', {
      title: 'User Login',
    });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  console.log('[VIEWCONTROLLER] getMyTours - req.user:', req.user);
  // 1.FIND ALL BOOKINGS.
  const bookings = await Booking.find({ user: req.user.id });

  // 2.FIND TOURS WITH THE RETURNED IDS.
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', { title: 'My tours', tours });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', {
    title: 'your account',
    user: updatedUser,
  });
});
