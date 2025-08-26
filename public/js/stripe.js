import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { showAlert } from './alerts';
// const stripe = Stripe('pk_test_51S0KM7B7WOMy59vMHweHLB5ixdT0KzwNuv5bx34lRoOSa2Te64X70Xv7oMBnPP0A8Il5ShmCse2Hh03KFVBF6cMm00TJUUmFfd');
const stripePromise = loadStripe('pk_test_51S0KM7B7WOMy59vMHweHLB5ixdT0KzwNuv5bx34lRoOSa2Te64X70Xv7oMBnPP0A8Il5ShmCse2Hh03KFVBF6cMm00TJUUmFfd...');

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios({
      method: 'GET',
      url: `/api/v1/bookings/checkout-session/${tourId}`
    });
  
    console.log(session)
    const stripe = await stripePromise;
  
    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  }
  catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
