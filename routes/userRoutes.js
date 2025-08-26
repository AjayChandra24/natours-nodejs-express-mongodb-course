const express = require('express');
const userContoller = require('../controllers/userController');
const { signup, login, forgotPassword, resetPassword, protect, updatePassword, restrictTo, logout } = require('../controllers/authController');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.use(protect); // Middleware runs in sequence, all the routes which comes after this need to be protected (logged in, with authtoken)

router.get(
  '/me',
  userContoller.getMe,
  userContoller.getUser
);
router.patch('/updateMyPassword', updatePassword);
router.patch(
  '/updateMe',
  userContoller.uploadUserPhoto,
  userContoller.resizeUserPhoto,
  userContoller.updateMe
);
router.delete(
  '/deleteMe',
  userContoller.deleteMe
);

router.use(restrictTo('admin'));

router
  .route('/')
  .get(userContoller.getAllUsers)
  .post(userContoller.createUser);

router
  .route('/:id')
  .get(userContoller.getUser)
  .patch(userContoller.updateUser)
  .delete(userContoller.deleteUser);

module.exports = router;
