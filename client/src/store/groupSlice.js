import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../config';

// Fetch Groups
export const fetchGroups = createAsyncThunk('groups/fetchGroups', async (_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`${API_URL}/api/groups`, config);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

// Create Group
export const createGroup = createAsyncThunk('groups/createGroup', async (groupData, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.post(`${API_URL}/api/groups`, groupData, config);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

// Delete Group
export const deleteGroup = createAsyncThunk('groups/deleteGroup', async (id, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        await axios.delete(`${API_URL}/api/groups/${id}`, config);
        return id;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
});

const groupSlice = createSlice({
    name: 'groups',
    initialState: {
        groups: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchGroups.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchGroups.fulfilled, (state, action) => {
                state.loading = false;
                state.groups = action.payload;
            })
            .addCase(fetchGroups.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createGroup.fulfilled, (state, action) => {
                state.groups.push(action.payload);
            })
            // Delete
            .addCase(deleteGroup.fulfilled, (state, action) => {
                state.groups = state.groups.filter(g => g._id !== action.payload);
            });
    }
});

export default groupSlice.reducer;
