import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_URL from '../config';

export const fetchClients = createAsyncThunk('clients/fetchClients', async (scope = 'private') => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/api/clients?scope=${scope}`, {
        headers: { 'x-auth-token': token }
    });
    return res.data;
});

const clientSlice = createSlice({
    name: 'clients',
    initialState: {
        clients: [],
        loading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchClients.pending, (state) => { state.loading = true; })
            .addCase(fetchClients.fulfilled, (state, action) => {
                state.clients = action.payload;
                state.loading = false;
            })
            .addCase(fetchClients.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export default clientSlice.reducer;
