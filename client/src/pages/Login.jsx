import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    // const [isRegister, setIsRegister] = useState(false); // Disabled
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector(state => state.auth);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Login Only
        const res = await dispatch(login({ email: formData.email, password: formData.password }));
        if (!res.error) {
            // Redirect to app dashboard
            navigate('/app/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-dark">
                    Welcome Back
                </h2>
                {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error.msg || 'Error'}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-white p-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Login'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-500">
                    Access restricted to authorized personnel only.
                </div>
            </div>
        </div>
    );
};

export default Login;
