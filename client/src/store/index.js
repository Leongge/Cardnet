import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import clientReducer from './clientSlice';
import teamReducer from './teamSlice';
import groupReducer from './groupSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        clients: clientReducer,
        team: teamReducer,
        groups: groupReducer
    },
});

export default store;
