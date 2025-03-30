import { showAlert } from './alert';
import axios from 'axios';

console.log(window.Stripe);

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51R7fNmGEZSuE1PsXh39w1VmFhFTeOFSJcCXSDfFZkqOQBl3W9vTCRawKNctM8zBWYqBwZCfeOqXsj6kCPfHFuCTm00UDr9fLr0',
    );
    console.log(stripe);

    // 1. GET CHECK OUT SESSION FROM API
    // Inside bookTour(tourId), a request is sent to the backend to get a Stripe Checkout session.
    // Once the session is received, the browser redirects the user to Stripe's hosted checkout page.
    // The frontend calls stripe.redirectToCheckout({ sessionId }), which redirects the user to Stripe’s hosted checkout page.
    // GO TO BOOKINGCONTROLLER.JS
    // The user enters their payment details and completes the payment.
    const session = await axios(
      `http://localhost:8000/api/v1/bookings/checkout-session/${tourId}`,
    );
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log('[STRIPE.JS]bookTour - err:', err);
    // showAlert('[STRIPE.JS]bookTour - err:', err);
  }
};
