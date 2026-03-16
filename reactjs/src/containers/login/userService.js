import axios from 'axios';

// Lấy URL trực tiếp từ biến môi trường
const API_URL = process.env.REACT_APP_BACKEND_URL;

const login = async (username, password) => {
    return await axios.post(`${API_URL}/api/v1/login`, { username, password }, { withCredentials: true });
};

const logout = async () => {
    return await axios.get(`${API_URL}/api/v1/logout`, { withCredentials: true });
};

const account = async () => {
    return await axios.get(`${API_URL}/api/v1/account`, { withCredentials: true });
};

const loginWithGoogle = async (googleId, email, fullname) => {
    return await axios.post(`${API_URL}/api/v1/google`, { googleId, email, fullname }, { withCredentials: true });
};

export { login, logout, account, loginWithGoogle };