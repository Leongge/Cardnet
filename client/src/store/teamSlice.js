import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../config';

export const fetchTeamMembers = createAsyncThunk('team/fetchMembers', async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/team`, {
            headers: { 'x-auth-token': token }
        });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

export const addTeamMember = createAsyncThunk('team/addMember', async (userData, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API_URL}/api/team/register`, userData, {
            headers: { 'x-auth-token': token }
        });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

const teamSlice = createSlice({
    name: 'team',
    initialState: {
        members: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTeamMembers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTeamMembers.fulfilled, (state, action) => {
                state.loading = false;
                state.members = action.payload;
            })
            .addCase(fetchTeamMembers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addTeamMember.fulfilled, (state, action) => {
                state.members.push(action.payload);
            });
    }
});

export default teamSlice.reducer;
