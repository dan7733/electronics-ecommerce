import axios from 'axios';
import CryptoJS from 'crypto-js';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const SECRET_KEY = process.env.REACT_APP_STORAGE_SECRET; 

// Hàm giải mã lấy token (Đặt ở đây để dùng chung mà không dính tới React Hooks)
export const getAccessToken = () => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userData) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(userData, SECRET_KEY);
        const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        return user?.accessToken || null;
    } catch {
        return null;
    }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (token) prom.resolve(token);
        else prom.reject(error);
    });
    failedQueue = [];
};

// Thiết lập tự động cho mọi Axios request
export const setupAxiosInterceptors = (navigate, logoutContext) => {
    
    // REQUEST INTERCEPTOR: Tự động gắn Access Token vào mọi request
    axios.interceptors.request.use(
        (config) => {
            const token = getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // RESPONSE INTERCEPTOR: Tự động làm mới token nếu bị 401
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            
            // Thêm điều kiện !originalRequest.url.includes('/refresh-token')
            if (
                error.response &&
                error.response.status === 401 &&
                !originalRequest._retry &&
                !originalRequest.url.includes('/login') &&
                !originalRequest.url.includes('/refresh-token') 
            ) {
                originalRequest._retry = true;

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            return axios(originalRequest);
                        })
                        .catch((err) => Promise.reject(err));
                }

                isRefreshing = true;
                try {
                    // Gọi API xin token mới
                    const response = await axios.get(`${API_URL}/api/v1/refresh-token`, {
                        withCredentials: true,
                    });
                    
                    const { accessToken } = response.data;
                    
                    // Cập nhật lại Storage với token mới
                    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
                    if (userData) {
                        const bytes = CryptoJS.AES.decrypt(userData, SECRET_KEY);
                        const user = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                        
                        const updatedUser = { ...user, accessToken, auth: true };
                        const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
                        storage.setItem('user', CryptoJS.AES.encrypt(JSON.stringify(updatedUser), SECRET_KEY).toString());
                    }

                    processQueue(null, accessToken);
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    
                    // Chạy lại request đang bị kẹt
                    return axios(originalRequest);
                } catch (refreshError) {
                    // Nếu xin Refresh Token cũng lỗi (VD: Quá 7 ngày), thì ép đăng xuất
                    processQueue(refreshError, null);
                    if (logoutContext) logoutContext();
                    navigate('/login');
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
            return Promise.reject(error);
        }
    );
};

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