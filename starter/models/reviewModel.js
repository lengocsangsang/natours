const mongoose = require('mongoose');
const Tour = require('./tourModels');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review cannot be empty'] },
    rating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
    },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour', //WE DON'T NEED TO IMPORT Tour from tourModels.js
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User', //WE DON'T NEED TO IMPORT User from userModels.js
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  // this.populate({ path: 'tour', select: 'name' }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });  => THIS WILL CREATE A INFINITE LOOP OF POPULATING BETWEEN TOUR AND REVIEW
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// 1. CREATE A STATIC METHOD: calcAverageRatings, ATTACHED TO REVIEW MODEL by "reviewSchema.statics"
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 1.1 CREATE AN ARRAY CALLED STATS TO CALCULATE:nRating and avgRating
  // this REFERS TO REVIEW MODEL
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour', //$tour in Review Model
        nRating: { $sum: 1 }, //1.1.1 CREATED TO UPDATE ratingsQuantity IN Tour later.
        avgRating: { $avg: '$rating' }, //1.1.2 CREATED TO UPDATE ratingsAverage IN Tour later.
      },
    },
  ]);

  if (stats.length > 0) {
    // 1.2 UPDATE ratingsQuantity, ratingsAverage FOR ALL THE COLLECTION: TOUR MODEL.
    await Tour.findByIdAndUpdate(tourId, {
      //stats is this Array: [{_id: tourId, nRating: 3, avgRating: 4.333333}]
      ratingQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//2. UPDATING 2 PROPERTIES: ratingsQuantity, ratingsAverage OF Tour, AS A RESULT OF CREATING A NEW REVIEW
//2. CREATE A POST DOCUMENT MIDDLEWARE OF "SAVE" & RUN THE STATIC METHOD: calcAverageRatings ON IT.
reviewSchema.post('save', function () {
  // reviewSchema.post('save', function (next) {} => IS A DOCUMENT MIDDLEWARE.
  // this points to current review (= current instance = current doc)
  // this REFERS TO THE CURRENT DOCUMENT: A SINGLE REVIEW, INCLUDING A PROPERTY: tour = this.tour
  // calcAverageRatings IS A STATIC METHOD. SO WE HAVE TO CALL IT ON A MODEL.
  // this.constructor IS THE MODEL (REVIEW MODEL) WHICH CREATED THE CURRENT DOCUMENT (a review).
  // Review.calcAverageRatings(this.tour); => Review not yet defined here.!!! Only this.constructor
  this.constructor.calcAverageRatings(this.tour);
  // IF ANY REVIEW CREATED (SAVED) => THIS MIDDLEWARE WILL BE CALLED
  // this.constructor.calcAverageRatings(this.tour); WILL BE CALLED.
  // 2 PROPERTIES: ratingsQuantity, ratingsAverage OF Tour WILL BE UPDATED.
  // next(); //NO NEXT FOR POST.
});

// 3. FOR UPDATING/DELETING A REVIEW
//3.1 CREATE A PRE QUERY MIDDLEWARE OF /^findOneAnd/ TO SAVE THE CURRENT DOCUMENT FOR LATER UPDATING.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  // reviewSchema.pre(/^findOneAnd/, async function (next){} => IS A QUERY MIDDLEWARE.
  // this IS A Query OBJECT
  //✔ A query object is just a representation of a query; it does not contain the document until executed.
  //✔ Query execution happens when you await it or call .exec().
  // Below this.r: document = a query already executed.
  this.r = await this.findOne();
  // this.findOne() will find the document about to be updated.
  // Retrieves the same document that findOneAnd...() is modifying.
  // IF ANY QUERY BEGINS WITH findOneAnd IS SENT
  // THIS MIDDLEWARE WILL BE CALLED AND
  // this.r WILL BE CREATED WITH THE CURRENT DOCUMENT (A SINGLE REVIEW)
  next();
});

//3.2. CREATE ANOTHER QUERY MIDDLEWARE OF /^findOneAnd/, AND RUN STATIC METHOD: calcAverageRatings ON THE DOCUMENT.
reviewSchema.post(/^findOneAnd/, async function (next) {
  //reviewSchema.post(/^findOneAnd/, async function (next) {} IS A DOCUMENT MIDDLEWARE.
  // this.r = await this.findOne(); => DOES NOT WORK HERE, QUERY HAS ALREADY EXISTED.
  // this.r REFERS TO THE DOCUMENT SAVED DURING reviewSchema.pre(/^findOneAnd/, async function (next){}
  // this.r.constructor REFERS TO THE REVIEW MODEL WHICH CREATED this.r document (a single review).
  await this.r.constructor.calcAverageRatings(this.r.tour);
  // 2 PROPERTIES: ratingsQuantity, ratingsAverage OF Tour WILL BE UPDATED, AS A RESULT OF REVIEW UPDATING/DELETING
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
