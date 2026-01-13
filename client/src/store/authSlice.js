import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../config';

// Async Thunks
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${API_URL}/api/auth/login`, credentials);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${API_URL}/api/auth/register`, userData);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) return rejectWithValue({ msg: 'No token' });

        const res = await axios.get(`${API_URL}/api/auth/user`, {
            headers: { 'x-auth-token': token }
        });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data || { msg: 'Failed to load user' });
    }
});

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    error: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            state.token = null;
            state.isAuthenticated = false;
            state.user = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => { state.loading = true; })
            .addCase(login.fulfilled, (state, action) => {
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.loading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.fulfilled, (state, action) => {
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.loading = false;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                localStorage.setItem('user', JSON.stringify(action.payload));
                state.user = action.payload;
                state.isAuthenticated = true;
                state.loading = false;
            })
            .addCase(loadUser.rejected, (state) => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                state.token = null;
                state.isAuthenticated = false;
                state.user = null;
                state.loading = false;
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
