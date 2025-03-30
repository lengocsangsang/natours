const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); //npm install bcryptjs

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: validator.isEmail,
      message: 'Please provide a valid email',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guid', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password; //abc === abc
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// THIS WAS COMMENTED OUT FOR IMPORTING DATA FROM JSON FILE.
// userSchema.pre('save', async function (next) {
//   // Only run this function if password was actually modified.
//   if (!this.isModified('password')) return next();

//   // CREATE SALTROUNDS
//   this.saltRounds = 12;
//   // CREATE SALT(RANDOM STRING)
//   this.salt = await bcrypt.genSalt(this.saltRounds);
//   //HASH THE PLAIN PASSWORD WITH SALT
//   this.password = await bcrypt.hash(this.password, this.salt);

//   // Delete the passwordConfirm field
//   this.passwordConfirm = undefined;
//   next();
// });

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, function (next) {
  //THIS POINTS TO THE CURRENT QUERY
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    console.log(
      '🎈🎈🎈THIS NEEDS RE-LEARNING:',
      changedTimestamp,
      JWTTimestamp,
    );
    return JWTTimestamp < changedTimestamp;
  }

  // FALSE means not changed.
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // GENERATE A SECURE RANDOM TOKEN (ORIGINAL TOKEN TO SEND TO USER)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // HASH THE TOKEN WITH SHA256 BEFORE STORING IT IN THE DATABASE (HASHED TOKEN STORED IN DATABASE)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
