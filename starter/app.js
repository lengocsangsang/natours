const cors = require('cors'); // Import CORS / INTALL VIA NPM FIRST PLEASE
const path = require('path'); //A NATIVE BUILTIN MODULE
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { expressCspHeader, SELF } = require('express-csp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
// On the backend, Express does not automatically parse cookies. You need cookie-parser middleware:
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// starts an express app
const app = express();

// ✅PUG
// This tells Express to use Pug as the templating engine.
// It allows you to render .pug files without specifying the file extension explicitly.
app.set('view engine', 'pug');

// This sets the directory where Express looks for Pug template files: FOLDER named "views"
// path.join(__dirname, "views") ensures that the path is correctly resolved, regardless of the operating system.
app.set('views', path.join(__dirname, 'views'));

// ✅✅ GLOBAL MIDDLEWARES

// ✅ TO DEAL WITH CORS
// Allow all origins (For development, restrict in production)
// app.use(cors());

// Allow only specific origins (Recommended for security)
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow frontend to access API   // "localhost" or 127.0.0.1 MATTERS!
    credentials: true, // ALLOW COOKIES!
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  }),
);

// SET SECURITY HTTP headers
app.use(helmet()); //THIS SHOULD BE PUT AS FIRST OF ALL MIDDLEWARES
// HELMET IS A COLLECTION OF MULTI-MIDDLEWARES. YOU CAN LEARN IT FROM GITHUB

//SERVING STATIC FILES
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// MY CODE TO SEE WHICH ENVIRONMENT I AM RUNNING MY APP

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//LIMIT REQUESTS FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour',
});
app.use('/api', limiter);

// BODY PARSER, READING DATA FROM BODY INTO REQ.BODY
app.use(express.json({ limit: '10kb' }));
// USER DATA FORM SENT BY FUNCTION: viewController.updateUserData=> THIS WILL HELP TO SEND DATA
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// On the backend, Express does not automatically parse cookies. You need cookie-parser middleware:
app.use(cookieParser());

//DATA SANITIZATION AGAINST NOSQL QUERY INJECTION
app.use(mongoSanitize());

//DATA SANITIZATION AGAINST XSS
app.use(xss());

// PREVENT PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

//APP-TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(
    '🎃 [APP.JS] Incoming Cookies = req.headers.cookie:',
    req.headers.cookie,
  ); // Check raw cookies
  console.log('🎃 [APP.JS] Parsed Cookies = req.cookies:', req.cookies); // Check parsed cookies
  console.log(
    '🎃[APP.JS] ENVIRONMENT VARIABLE = process.env.NODE_ENV:',
    process.env.NODE_ENV,
  ); // Check environment variable
  next();
});

// 2)MOUNTING ROUTES
app.use('/', viewRouter); // FOR RENDERING PUG FILES WITH DATABASE INFO (TOUR, USER, REVIEW) TO CLIENT
app.use('/api/v1/tours', tourRouter); //FOR CALLING TOUR API
app.use('/api/v1/users', userRouter); //FOR CALLING USER API
app.use('/api/v1/reviews', reviewRouter); //FOR CALLING REVIEW API
app.use('/api/v1/bookings', bookingRouter); //FOR CALLING REVIEW API

app.all('*', (req, res, next) => {
  console.log(
    '🎃[APP.JS] THIS ROUTE MAY BE NOT YET DEFINED. CHECK: protocol/localhost/IP:Port/path',
  );
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler); //FROM errorController.js

module.exports = app;
