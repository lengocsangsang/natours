// updateData
import axios from 'axios'; //ES6 MODULE SYNTAX, NOT COMMON JS SYNTAX
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  // type is either "password" or "data"
  try {
    const url =
      type === 'password'
        ? 'http://localhost:8000/api/v1/users/updateMyPassword'
        : 'http://localhost:8000/api/v1/users/updateMe';

    console.log('🎃[UPDATESETTINGS.JS] updatesettings: ', url);

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
