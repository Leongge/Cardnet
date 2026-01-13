import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeamMembers, addTeamMember } from '../store/teamSlice';
import { Users, Plus, Shield } from 'lucide-react';

const ManageTeam = () => {
    const dispatch = useDispatch();
    const { members, loading } = useSelector(state => state.team);
    const { user } = useSelector(state => state.auth);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        position: ''
    });

    useEffect(() => {
        dispatch(fetchTeamMembers());
    }, [dispatch]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await dispatch(addTeamMember(formData));
        if (!res.error) {
            setShowAddForm(false);
            setFormData({ name: '', email: '', password: '', position: '' });
            alert('Member added successfully!');
        } else {
            alert(res.payload?.msg || 'Failed to add member');
        }
    };

    if (user.role !== 'CorporateAdmin') {
        return <div className="text-center p-10 text-red-500">Access Denied. Corp Admins Only.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-primary" /> Corporate Team Management
                </h2>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                >
                    <Plus size={18} /> Add Member
                </button>
            </div>

            {/* Add Member Form */}
            {showAddForm && (
                <div className="bg-white p-6 rounded-lg shadow border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Register New Employee</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full Name"
                            className="border p-2 rounded"
                            required
                        />
                        <input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email Address"
                            type="email"
                            className="border p-2 rounded"
                            required
                        />
                        <input
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Set Initial Password"
                            type="password"
                            className="border p-2 rounded"
                            required
                        />
                        <input
                            name="position"
                            value={formData.position}
                            onChange={handleChange}
                            placeholder="Position (e.g. Sales)"
                            className="border p-2 rounded"
                        />
                        <button type="submit" className="md:col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                            Create Account
                        </button>
                    </form>
                </div>
            )}

            {/* Members List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="3" className="p-4 text-center">Loading...</td></tr>
                        ) : members.length === 0 ? (
                            <tr><td colSpan="3" className="p-4 text-center text-gray-500">No members found.</td></tr>
                        ) : (
                            members.map(member => (
                                <tr key={member._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                        <div className="text-sm text-gray-500">{member.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'CorporateAdmin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {member.role === 'CorporateAdmin' ? 'Admin' : 'Member'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        Active
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageTeam;
