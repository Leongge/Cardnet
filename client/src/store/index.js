import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import clientReducer from './clientSlice';
import teamReducer from './teamSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        clients: clientReducer,
        team: teamReducer
    },
});

export default store;
