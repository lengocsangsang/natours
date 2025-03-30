const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModels');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './starter/config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful!'));

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'),
);

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);

    // { validateBeforeSave: false } WAS USED FOR IMPORTING DATA FROM JSON FILE.
    await User.create(users, { validateBeforeSave: false });

    await Review.create(reviews);
    console.log('Data succesfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// This worked! But just for my own fun! No use.
const deleteField = async () => {
  try {
    let tours = fs.readFileSync(`${__dirname}/tourse.json`, 'utf8');
    const tours1 = JSON.parse(
      tours.replace(/ratingsAverage/g, 'ratingAverage'),
    );
    tours1.forEach((obj) =>
      console.log('tours1.ratingsAverage', obj.ratingsAverage),
    );
    await Tour.create(tours1);
  } catch (err) {
    console.log('error occurred:', err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  console.log('PROCESS.ARGV:', process.argv);
  importData(); //node ./starter/dev-data/data/import-dev-data.js --import
} else if (process.argv[2] === '--delete') {
  console.log('PROCESS.ARGV:', process.argv);
  deleteData(); //node ./starter/dev-data/data/import-dev-data.js --delete
} else if (process.argv[2] === '--deleteField') {
  console.log('PROCESS.ARGV:', process.argv);
  deleteField();
}

// THIS COMMAND IN THE TERMINAL: PS E:\SANG\NODEJS\complete-node-bootcamp-master\complete-node-bootcamp-master\4-natours> node ./starter/dev-data/data/import-dev-data.js --import
// WILL CREATE A ARRAY CALLED PROGRESS.ARGV:

// PROCESS.ARGV:
// [
//   'E:\\BOOKS\\PROGRAMMING\\node.exe', => process.argv[0]
//   'E:\\SANG\\NODEJS\\complete-node-bootcamp-master\\complete-node-bootcamp-master
//      \\4-natours\\starter\\dev-data\\data\\import-dev-data.js', => process.argv[1]
//   '--import' => process.argv[2]
// ]

// WE USE process.argv[2] AS A TRIGGER TO IMPLEMENT CORRESPONDING FUCTIONS LIKE DELETE OR IMPORT DATA.
// IN ORDER TO DELETE OR IMPORT DATA, WE HAVE TO CONNECT TO MONGODB FIRST. THEN WE CAN IMPORT DATA
// FROM SAMPLE DATA TO MONGODB VIA OUR MODEL (Tour) CREATED from (Schema).
