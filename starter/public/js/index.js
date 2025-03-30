/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe.js';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Creating a FormData Object
    // 🔹 FormData() is used to send form data, including files, to the backend.
    // 🔹 It allows sending multipart/form-data requests, which are needed for file uploads.
    const form = new FormData();

    // 🔹 form.append(key, value) adds form fields one by one:
    // name → Text input value.
    // email → Email input value.
    // photo → The first selected file (files[0]).
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log('🎃[INDEX.JS] event on userDataForm - form: ', form);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', (e) => {
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    console.log(
      '🎃[updateSettings.js] userPasswordForm:',
      passwordCurrent,
      password,
      passwordConfirm,
    );
    updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    document.querySelector('.btn--save-password').textContent =
      'Saved password';
  });

if (bookBtn)
  // INITIAL: When the user clicks the "Book Tour" button:

  bookBtn.addEventListener('click', (e) => {
    console.log('🎃[INDEX.JS] event on bookBtn - e: ', e);
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    console.log('🎃[INDEX.JS] event on bookBtn - tourId: ', tourId);
    console.log('🎃[INDEX.JS] event on bookBtn - bookTour:', bookTour);
    // STRIPE.JS/bookTour
    // The bookBtn button's click event listener triggers bookTour(tourId)
    bookTour(tourId);
    // GO TO STRIPE.JS
  });
