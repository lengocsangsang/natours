const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController.js');
const authController = require('./../controllers/authController.js');
const router = express.Router();

const upload = multer({ dest: './starter/public/img/users' });

router.post('/signup', authController.signup);
router.post('/login', authController.login); // 'http://localhost:8000/api/v1/users/login'
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); //MIDDLEWARE RUNS IN SEQUENCE WILL PROTECT ALL BELOW ROUTES.

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
  '/me',
  userController.getMe, // get and pass the current user's id to the the function
  userController.getUser,
);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);

router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin')); //MIDDLEWARE RUNS IN SEQUENCE WILL RESTRICT ALL BELOW ROUTES.

router
  .route('/')
  .get(userController.getAllusers)
  .post(userController.createUsers);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
