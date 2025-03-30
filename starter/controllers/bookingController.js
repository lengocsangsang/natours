const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModels');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // When the frontend requests a checkout session:
  // The backend retrieves the tour details from the database using Tour.findById(req.params.tourID).
  const tour = await Tour.findById(req.params.tourID);
  // 2. CREATE CHECKOUT SESSION

  // The backend uses stripe.checkout.sessions.create({ ... }) to create a checkout session.
  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // ✅ Ensure mode is specified
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}.jpg`,
            ],
          },
          unit_amount: tour.price * 100, // Convert price to cents
        },
        quantity: 1,
      },
    ],
  });
  console.log(
    '🎃[bookingController.js] getCheckoutSession - session:',
    session,
  );
  // The backend responds with res.status(200).json({ session }).
  res.status(200).json({
    status: 'success',
    session,
  });
  // Stripe redirects the user to the success URL.
  // The backend can be set up to listen for webhooks to confirm the payment and create a booking record.
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // THIS IS ONLY TEMPORARY. UNSECURED. EVERYONE CAN MAKE BOOKING WITHOUT PAYING
  console.log(req.query);
  const { tour, user, price } = req.query;
  console.log(tour);

  if (!tour && !user && !price) return next();
  await Booking.create({
    tour: mongoose.Types.ObjectId(tour), // Convert to ObjectId
    user: mongoose.Types.ObjectId(user), // Convert to ObjectId
    price: Number(price),
  }); // Convert to number});

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
