const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

// ✅FUNCTION: CREATE JWT TOKEN
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

// ✅FUNCTION: CREATE AND SENT TOKEN TO CLIENT FROM SERVER
const createSendToken = (user, statusCode, res) => {
  // TO CREATE TOKEN: NEED "user._id"
  const token = signToken(user._id);

  // CREATE COOKIE
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, //WE CANNOT MANIPULATE COOKIES IN BROWSER IN ANYWAY
  };

  // Setting Secure Cookies in Production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // Secure: true → Cookie is only sent over HTTPS, not HTTP.
  // This protects against Man-in-the-Middle (MITM) attacks.
  // In local development, it's false (otherwise, cookies won’t work in HTTP).

  // SEND COOKIE
  res.cookie('jwt', token, cookieOptions);
  // res.cookie(name, value, options) is an Express.js function that attaches a Set-Cookie header to the HTTP response.
  // 👉 This tells the browser to store the cookie and send it back with every subsequent request.
  //     Example: If token = 'abc123', the browser receives this response header:
  //     Set-Cookie: jwt=abc123; HttpOnly; Expires=Fri, 22 Mar 2025 12:00:00 GMT; Secure
  // 👉 How the Client Receives and Stores the Cookie
  // When the response reaches the browser, the browser processes the Set-Cookie header and stores the cookie.
  // The cookie is now saved in the browser (DevTools → Application → Cookies).
  // 👉 Now, every time the client makes a request to the server, the browser automatically attaches the cookie in the Cookie header:
  // This means the user stays logged in, and the server can extract the token from req.cookies.jwt.
  // 👉 On the backend, Express does not automatically parse cookies. You need cookie-parser middleware:
  // const cookieParser = require('cookie-parser');
  // app.use(cookieParser());

  // REMOVE THE PASSWORD FROM THE OUTPUT
  user.password = undefined;

  // STATUSCODE IS USED HERE
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

// ✅SIGNUP: CREATE USER AS PER SCHEMA & SAVE USER TO DATABASE AS DOC. CREATE & SEND TOKEN TO CLIENT AS COOKIE
exports.signup = catchAsync(async (req, res, next) => {
  console.log('(From signup function) req.headers:', req.headers);

  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log('(From signup function) url:', url);

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  console.log(
    '🎭[AUTHCONTROLLER.JS] signup function - res._header:',
    res._header,
  );
});

// ✅LOGIN: CHECK INPUT EMAIL & PASSWORD. COMPARE WITH DATABASE. CREATE & SEND TOKEN AS COOKIE
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1.Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2.Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  console.log('🎃[AUTHCONTROLLER] login: ', user);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3.If everything ok, send token to client
  createSendToken(user, 200, res);
});

// ✅LOGOUT:
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// ✅PROTECT: CHECK TOKEN AVAILABILITY - CHECK DECODED.ID - CHECK USER EXISTENCE - CHECK CHANGED PASSWORD AFTER - GRANT ACCESS
exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting token and check if it is there.
  let token;
  // CHECK AUTHORIZATION WHEN API CALL BY POSTMAN
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    // CHECK WHEN API CALL BY FRONT END (AXIOS)
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401),
    );
  }

  // 2. Validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('The user having this token does no longer exist', 401),
    );
  }
  // 4. Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  res.locals.user = freshUser;
  console.log(
    '🎭[AUTHCONTROLLER] PROTECT FUNCTION CREATED req.user:',
    req.user,
  );
  next();
});

// ONLY FOR RENDERED PAGES, NO ERRORS!
// ✅ISLOGGEDIN: VERIFY TOKEN: CHECK DECODED.ID - CHECK USER EXISTENCE - CHECK CHANGED PASSWORD AFTER - GRANT ACCESS
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt)
    try {
      //1.VERIFY THE TOKEN
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );
      // 2. Check if user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // 3. Check if user changed password after the token was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  next();
};

// ✅RESTRICTTO: CHECK ROLES - PASS TO NEXT MIDDLEWARE
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array: ["admin", "lead-guide"]. role= "user"
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

// ✅FORGOT PASSWORD: CHECK USER BY EMAIL -  GENERATE RANDOM RESET-TOKEN - SEND TO USER BY EMAIL
exports.forgotPassword = catchAsync(async (req, res, next) => {
  console.log('(🎭[AUTHCONTROLLER] email: ', req.body.email);
  //1. GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });

  console.log('🎭[AUTHCONTROLLER] user has the provided email: ', user);
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  //2. GENERATE THE RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken(); // createPasswordResetToken: INSTANCE METHOD, CALLED ON A CERTAIN DOCUMENT.
  console.log('🎭[AUTHCONTROLLER] resetToken: ', resetToken);
  await user.save({ validateBeforeSave: false });

  //3.SEND IT TO USER'S EMAIL
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    console.log('🎭[AUTHCONTROLLER] resetURL: ', resetURL);
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({ status: 'success', message: 'Token sent to email' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

// ✅RESETPASSWORD: CREATE hashedToken FROM token -FIND USER BY hashedToken - SET NEW PASSWORD - SAVE USER - SEND TOKEN TO CLIENT AS COOKIE
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1.GET USER BASED ON THE TOKEN

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. IF TOKEN HAS NOT EXPIRED, AND THERE IS USER, SET THE NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. UPDATE changedPasswordAt property for the user

  // 4, LOG THE USER IN, SEND JWT
  createSendToken(user, 200, res);
});

// if (!user || !(await user.correctPassword(password, user.password))) {
//   return next(new AppError('Incorrect email or password', 401));
// }

// ✅UPDATE PASSWORD: CHECK USER BY ID - CHECK PASSWORD - UPDATE PASSWORD - SAVE USER - SEND TOKEN TO USER AS COOKIE
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');

  // 2. CHECK IF POSTED PASSWORD IS CORRECT

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3. If so, UPDATE THE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  console.log(
    '🎃[AUTHCONTROLLER.JS] updatePassword: ',
    user.password,
    user.passwordConfirm,
  );
  await user.save();
  // User.findByIdAndUpdate will NOT work. Only CREATE or SAVE
  // 4. LOG USER IN, SEND JWT
  createSendToken(user, 200, res);
});
