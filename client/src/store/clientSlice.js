import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchClients = createAsyncThunk('clients/fetch', async (scope, { getState, rejectWithValue }) => {
    try {
        const { token } = getState().auth;
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`/api/clients?scope=${scope || 'private'}`, config);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response.data);
    }
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
