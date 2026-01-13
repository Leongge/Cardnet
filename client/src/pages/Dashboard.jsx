import React, { useEffect, useState } from 'react';
import { Camera, Upload, Users, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

const Dashboard = () => {
    const navigate = useNavigate();
    const [totalClients, setTotalClients] = useState(0);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${API_URL}/api/clients?scope=private`, {
                    headers: { 'x-auth-token': token }
                });
                setTotalClients(res.data.length);
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-primary">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">Total Clients</p>
                            <h3 className="text-2xl font-bold">{totalClients}</h3>
                        </div>
                        <Users className="text-primary" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow text-center">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="flex justify-center gap-6">
                    <button
                        onClick={() => navigate('/app/review')}
                        className="flex flex-col items-center justify-center w-48 h-48 bg-blue-50 border-2 border-dashed border-primary rounded-xl hover:bg-blue-100 transition cursor-pointer"
                    >
                        <Camera size={48} className="text-primary mb-2" />
                        <span className="font-semibold text-primary">Scan Cards</span>
                        <span className="text-xs text-gray-500 mt-1">Camera or Upload</span>
                    </button>

                    <button
                        onClick={() => navigate('/app/clients')}
                        className="flex flex-col items-center justify-center w-48 h-48 bg-purple-50 border-2 border-dashed border-purple-500 rounded-xl hover:bg-purple-100 transition cursor-pointer"
                    >
                        <Mail size={48} className="text-purple-500 mb-2" />
                        <span className="font-semibold text-purple-600">Email Campaign</span>
                        <span className="text-xs text-gray-500 mt-1">Bulk Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
