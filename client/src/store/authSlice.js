import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const res = await axios.post('/api/auth/login', credentials);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
    try {
        const res = await axios.post('/api/auth/register', userData);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'), // Basic check
    loading: false,
    user: null, // Should fetch user on load if token exists
    error: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('token');
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
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.loading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Register logic similar to login
            .addCase(register.fulfilled, (state, action) => {
                localStorage.setItem('token', action.payload.token);
                state.token = action.payload.token;
                state.isAuthenticated = true;
                state.user = action.payload.user;
                state.loading = false;
            });
    }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
