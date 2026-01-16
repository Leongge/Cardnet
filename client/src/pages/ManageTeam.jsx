import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeamMembers, addTeamMember } from '../store/teamSlice';
import { fetchGroups, createGroup, deleteGroup } from '../store/groupSlice'; // Import group actions
import { Users, Plus, Shield, Layers, Trash2, Search } from 'lucide-react';

const ManageTeam = () => {
    const dispatch = useDispatch();
    const { members, loading: membersLoading } = useSelector(state => state.team);
    const { groups, loading: groupsLoading } = useSelector(state => state.groups);
    const { user } = useSelector(state => state.auth);

    const [activeTab, setActiveTab] = useState('members'); // 'members' or 'groups'
    const [showAddForm, setShowAddForm] = useState(false);
    const [showGroupForm, setShowGroupForm] = useState(false);

    // Member Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        position: ''
    });

    // Group Form State
    const [groupData, setGroupData] = useState({
        name: '',
        selectedMembers: []
    });
    const [memberSearch, setMemberSearch] = useState(''); // New search state

    useEffect(() => {
        dispatch(fetchTeamMembers());
        dispatch(fetchGroups());
    }, [dispatch]);

    const handleMemberChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMemberSubmit = async (e) => {
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

    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        const res = await dispatch(createGroup({
            name: groupData.name,
            members: groupData.selectedMembers
        }));
        if (!res.error) {
            setShowGroupForm(false);
            setGroupData({ name: '', selectedMembers: [] });
            alert('Group created successfully!');
        } else {
            alert(res.payload?.msg || 'Failed to create group');
        }
    };

    const toggleMemberSelection = (memberId) => {
        setGroupData(prev => {
            const isSelected = prev.selectedMembers.includes(memberId);
            if (isSelected) {
                return { ...prev, selectedMembers: prev.selectedMembers.filter(id => id !== memberId) };
            } else {
                return { ...prev, selectedMembers: [...prev.selectedMembers, memberId] };
            }
        });
    };

    const handleDeleteGroup = async (id) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            await dispatch(deleteGroup(id));
        }
    };

    if (user.role !== 'CorporateAdmin') {
        return <div className="text-center p-10 text-red-500">Access Denied. Corp Admins Only.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-primary" /> Corporate Management
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b">
                <button
                    onClick={() => setActiveTab('members')}
                    className={`pb-2 px-4 ${activeTab === 'members' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}`}
                >
                    Team Members
                </button>
                <button
                    onClick={() => setActiveTab('groups')}
                    className={`pb-2 px-4 ${activeTab === 'groups' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}`}
                >
                    Groups
                </button>
            </div>

            {/* MEMBERS TAB */}
            {activeTab === 'members' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                        >
                            <Plus size={18} /> Add Member
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="bg-white p-6 rounded-lg shadow border border-blue-100">
                            <h3 className="text-lg font-semibold mb-4">Register New Employee</h3>
                            <form onSubmit={handleMemberSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="name" value={formData.name} onChange={handleMemberChange} placeholder="Full Name" className="border p-2 rounded" required />
                                <input name="email" value={formData.email} onChange={handleMemberChange} placeholder="Email" type="email" className="border p-2 rounded" required />
                                <input name="password" value={formData.password} onChange={handleMemberChange} placeholder="Password" type="password" className="border p-2 rounded" required />
                                <input name="position" value={formData.position} onChange={handleMemberChange} placeholder="Position" className="border p-2 rounded" />
                                <button type="submit" className="md:col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">Create Account</button>
                            </form>
                        </div>
                    )}

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
                                {membersLoading ? (
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
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${member.role === 'CorporateAdmin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                    {member.role === 'CorporateAdmin' ? 'Admin' : 'Member'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">Active</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* GROUPS TAB */}
            {activeTab === 'groups' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowGroupForm(!showGroupForm)}
                            className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                        >
                            <Layers size={18} /> Create Group
                        </button>
                    </div>

                    {showGroupForm && (
                        <div className="bg-white p-6 rounded-lg shadow border border-blue-100">
                            <h3 className="text-lg font-semibold mb-4">Create New Group</h3>
                            <form onSubmit={handleGroupSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Group Name</label>
                                    <input
                                        type="text"
                                        value={groupData.name}
                                        onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>

                                    {/* Search Input */}
                                    <div className="relative mb-2">
                                        <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search by name or email..."
                                            value={memberSearch}
                                            onChange={(e) => setMemberSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border p-2 rounded">
                                        {members
                                            .filter(m => m.role !== 'CorporateAdmin')
                                            .filter(m =>
                                                m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                                                m.email.toLowerCase().includes(memberSearch.toLowerCase())
                                            )
                                            .map(member => (
                                                <label key={member._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                                                    <input
                                                        type="checkbox"
                                                        checked={groupData.selectedMembers.includes(member._id)}
                                                        onChange={() => toggleMemberSelection(member._id)}
                                                        className="rounded text-primary focus:ring-primary"
                                                    />
                                                    <div className="text-sm">
                                                        <div className="font-medium">{member.name}</div>
                                                        <div className="text-xs text-gray-500">{member.email}</div>
                                                    </div>
                                                </label>
                                            ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{groupData.selectedMembers.length} members selected</p>
                                </div>
                                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Create Group</button>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupsLoading ? (
                            <div className="col-span-full text-center p-10">Loading groups...</div>
                        ) : groups.length === 0 ? (
                            <div className="col-span-full text-center p-10 text-gray-500 border-2 border-dashed rounded-lg">
                                No groups found. Create one to get started.
                            </div>
                        ) : (
                            groups.map(group => (
                                <div key={group._id} className="bg-white rounded-lg shadow-sm border p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-bold text-gray-800">{group.name}</h3>
                                            <button
                                                onClick={() => handleDeleteGroup(group._id)}
                                                className="text-red-400 hover:text-red-600 p-1"
                                                title="Delete Group"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500 mb-4">
                                            {group.members.length} Members
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {group.members.slice(0, 5).map(m => (
                                                <span key={m._id} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                    {m.name.split(' ')[0]}
                                                </span>
                                            ))}
                                            {group.members.length > 5 && (
                                                <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
                                                    +{group.members.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTeam;
