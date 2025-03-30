// THIS IS TO MAKE API CALL TO SERVER ON http://localhost:8000 AT END POINT: /api/v1/users/login
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  console.log('Request Body:', { email, password }); // ✅ FIXED
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
      withCredentials: true,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  console.log('🎈LOGOUTTTTT');
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout',
    });
    console.log('🎈111', 'res.data.status');
    if ((res.data.status = 'success')) {
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again');
  }
};
