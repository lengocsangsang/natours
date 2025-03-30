const multer = require('multer');
const sharp = require('sharp');
const mongoose = require('mongoose');

const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './starter/public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// ONLY SAVE FILE IN RAM/BUFFER. FILE WILL DISAPPEAR AFTER REQUEST.
// FILE IS ACCESSABLE ON req.file.buffer
const multerStorage = multer.memoryStorage();

// MIDDLEWARE FOR FILTER FILE TYPE
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('not an image! Please upload only images.', 400), false);
  }
};

// INITIALIZE MULTER
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');
// ✅ Behind the scenes of upload.single('photo'):
// Receives a file from a POST request.
// Extracts the file from the form field "photo".
// Processes the file based on Multer’s storage configuration.
// Stores the file (either in memory or on disk).
// 👓Attaches file details to req.file.

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  console.log('🎃[USERCONTROLLER] resizeUserPhoto - req.file: ', req.file);
  if (!req.file) return next();
  // CREATE FILE NAME BECAUSE multer.memoryStorage() DIDNOT DO IT LIKE multer.diskStorage
  // FILE NAME IS REQUIRED FOR SAVING FILE LATER TO SERVER FILE SYSTEM
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  // USE SHARP TO RESIZE PHOTO
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`./starter/public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log('🎃[USERCONTROLLER] updateMe - 1.req.file ', req.file);
  console.log('🎃[USERCONTROLLER] updateMe: - 2. req.body', req.body);
  // 1. CREATE ERROR IF USER POSTS PASSWORD DATA
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /UpdateMyPassword',
        400,
      ),
    );
  }

  // FILTER OUT UNWANTED FIELDS NAMES THAT ARE NOT ALLOWED TO BE UPDATED
  const filteredBody = filterObj(req.body, 'name', 'email');

  // add photo property to filteredBody and add req.file.filename to it
  if (req.file) filteredBody.photo = req.file.filename;
  // 2.UPDATE USER DOCUMENT

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  console.log('🎃[userController] updateMe - 3. updatedUser:', updatedUser);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not yet defined. PLEASE USE /SIGNUP INSTEAD',
  });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// GET ALL USERS
exports.getAllusers = factory.getAll(User);
// GET USER
exports.getUser = factory.getOne(User);
// UPDATE USER (FOR ONLY ADMIN)
// DO NOT UPDATE PASSWORDS WITH THIS.
exports.updateUser = factory.updateOne(User);
// DELETE USER
exports.deleteUser = factory.deleteOne(User);
