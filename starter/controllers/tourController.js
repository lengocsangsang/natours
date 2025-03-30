const mongoose = require('mongoose'); //THIS IS DONE BY ME ONLY TO CHECK ID

const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../models/tourModels');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  { name: 'images', maxCount: 3 },
]);

// upload.array('images', 5); this produce req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(
    '🎃[TOURCONTROLLER] resizeTourImages - req.files.imageCover: ',
    req.files.imageCover,
  );

  if (!req.files.imageCover || !req.files.images) return next();

  // 1.COVER IMAGE
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`./starter/public/img/tours/${req.body.imageCover}`);

  // 2.IMAGES
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`./starter/public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

exports.aliasTopTours = (req, res, next) => {
  console.log('implement aliasTopTours');
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

// GET TOUR
exports.getTour = factory.getOne(Tour, { path: 'review' });

// Create Tour
exports.createTour = factory.createOne(Tour);

// UPDATE TOUR
exports.updateTour = factory.updateOne(Tour);

// DELETE TOUR
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    { $sort: { avgPrice: 1 } },
    // { $match: { _id: { $ne: 'EASY' } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year; // 2021
  console.log(year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'please provide latitude and longitude in the format lat,lng',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      //geoNear must be always the first phase.
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: { data: distances },
  });
});

//Tour.findOne({ _id: req.params.id })

// if (!tour) {
//   return next(new AppError('No tour found with that ID', 404));
// }
// THIS above if (!tour) is not working: The error message you're seeing
// ("Cast to ObjectId failed for value ... at path \"_id\" for model \"Tour\")
// occurs when Mongoose is unable to cast the provided ID into a valid ObjectId
// or querying the MongoDB database.
//In MongoDB, the _id field is typically an ObjectId, and Mongoose tries to convert
// the value provided in req.params.id to an ObjectId. If it can't convert the
// value properly (because it's not a valid ObjectId format), it throws a casting error.
//Why This Happens:
//You are passing an invalid ID or a string that cannot be converted into an ObjectId.
// In this case, "67bb085f40bedf32d443bb630" might not be a valid ObjectId.
//This error happens before the check for tour exists in your code, meaning Mongoose is
// trying to perform the findById operation, but it's failing during the conversion step.
//How to Fix It:
//You need to check if the provided req.params.id is a valid ObjectId before querying the database.
//Mongoose provides a utility method called mongoose.Types.ObjectId.isValid() to check if the given
// ID is a valid ObjectId. You can use this check before performing the findById query.
