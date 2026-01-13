import axios from 'axios';
import API_URL from './config';

// Create axios instance with base URL
const axiosInstance = axios.create({
    baseURL: API_URL
});

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
