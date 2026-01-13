import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Building, Plus, ShieldCheck } from 'lucide-react';
import API_URL from '../config';

const PlatformDashboard = () => {
    const { user } = useSelector(state => state.auth);
    const [corporations, setCorporations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        maxLicenses: 5
    });

    const fetchCorporations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/platform/corporations`, {
                headers: { 'x-auth-token': token }
            });
            setCorporations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchCorporations();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/platform/create-corporation`, formData, {
                headers: { 'x-auth-token': token }
            });
            alert('Corporation Created Successfully!');
            setShowForm(false);
            setFormData({
                companyName: '',
                adminName: '',
                adminEmail: '',
                adminPassword: '',
                maxLicenses: 5
            });
            fetchCorporations();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to create corporation');
        }
    };

    if (user?.role !== 'Admin') {
        return <div className="p-10 text-center text-red-500">Access Denied. Super Admin Only.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="text-blue-900" /> Platform Management
                </h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 flex items-center gap-2"
                >
                    <Plus size={18} /> New Corporation
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow border border-blue-900 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4 text-blue-900">Provision New Corporation</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Company Name</label>
                            <input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border p-2 rounded" required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Corp Admin Name</label>
                            <input name="adminName" value={formData.adminName} onChange={handleChange} className="w-full border p-2 rounded" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Corp Admin Email</label>
                            <input name="adminEmail" value={formData.adminEmail} onChange={handleChange} className="w-full border p-2 rounded" type="email" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Initial Password</label>
                            <input name="adminPassword" value={formData.adminPassword} onChange={handleChange} className="w-full border p-2 rounded" type="password" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">License Limit</label>
                            <input name="maxLicenses" value={formData.maxLicenses} onChange={handleChange} className="w-full border p-2 rounded" type="number" />
                        </div>

                        <button type="submit" className="md:col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                            Create & Provision
                        </button>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Licenses</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {corporations.map(corp => (
                            <tr key={corp._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                    <Building size={16} className="text-gray-400" />
                                    {corp.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{corp.subscription_tier}</td>
                                <td className="px-6 py-4 text-gray-500">{corp.max_licenses}</td>
                                <td className="px-6 py-4 text-gray-500">{new Date(corp.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlatformDashboard;
