import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients } from '../store/clientSlice';
import { fetchGroups } from '../store/groupSlice';
import { Search, Filter, Send, Users, Trash2, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const ClientList = () => {
    const dispatch = useDispatch();
    const { clients, loading } = useSelector(state => state.clients);
    const { groups } = useSelector(state => state.groups);
    const [scope, setScope] = useState('private');
    const [selectedClients, setSelectedClients] = useState([]);
    const [expandedClient, setExpandedClient] = useState(null);

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareTarget, setShareTarget] = useState('all'); // 'all' or 'groups'
    const [selectedGroups, setSelectedGroups] = useState([]);

    useEffect(() => {
        dispatch(fetchClients(scope));
        // Pre-fetch groups so they are ready
        dispatch(fetchGroups());
    }, [dispatch, scope]);

    const handleSelect = (id) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(cid => cid !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const sendCampaign = async () => {
        if (selectedClients.length === 0) return alert('Select clients first');
        try {
            await axios.post(`${API_URL}/api/campaign/send`, {
                clientIds: selectedClients,
                subject: 'Hello from Cardnet',
                body: 'This is a test campaign.'
            });
            alert(`Simulation: Emails sent to ${selectedClients.length} recipients!`);
            setSelectedClients([]);
        } catch (err) {
            alert('Campaign failed');
        }
    };

    const openShareModal = () => {
        if (selectedClients.length === 0) return alert('Select clients first');
        setShowShareModal(true);
        setShareTarget('all');
        setSelectedGroups([]);
    };

    const confirmShare = async () => {
        try {
            const token = localStorage.getItem('token');
            const payload = { clientIds: selectedClients };

            if (shareTarget === 'groups') {
                if (selectedGroups.length === 0) return alert('Please select at least one group');
                payload.groupIds = selectedGroups;
            } else {
                // If 'all', we might send empty groupIds or handling it backend side? 
                // Backend logic: if groupIds is provided (even empty), it sets shared_groups. 
                // To share with "Everyone" (which means empty shared_groups), we pass []? 
                // Or if we pass nothing, existing logic says?
                // Backend plan check:
                // "If groupIds provided... updateData.shared_groups = groupIds"
                // "else ... updateData.shared_groups = []"
                // So for 'all', we don't pass groupIds, or pass []. 
                // To be explicit, let's pass empty array if we mean "Everyone" in a strict system, 
                // but my backend logic handles undefined as "reset to empty".
                // Actually my updated backend code:
                // if (groupIds) { updateData.shared_groups = groupIds } else { updateData.shared_groups = [] }
                // So if I pass [], it works. If I don't pass it, it works.
                // But wait, if shareTarget is 'groups', I pass [id, id]. 
                // If shareTarget is 'all', I should pass [] (empty array) to clear any groups and match "else" block or explicitly match empty array logic?
                // The backend: if (groupIds) ... else { shared_groups = [] }. 
                // If I send groupIds: [], it is truthy? No, empty array is truthy in JS.
                // So `if ([])` is true. `shared_groups` becomes `[]`. Correct.
                payload.groupIds = [];
            }

            await axios.put(`${API_URL}/api/clients/share`,
                payload,
                { headers: { 'x-auth-token': token } }
            );
            alert('Clients shared to corporate pool successfully!');
            setSelectedClients([]);
            setShowShareModal(false);
            dispatch(fetchClients(scope)); // Refresh list
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Share failed');
        }
    };

    const toggleGroupSelect = (groupId) => {
        if (selectedGroups.includes(groupId)) {
            setSelectedGroups(selectedGroups.filter(id => id !== groupId));
        } else {
            setSelectedGroups([...selectedGroups, groupId]);
        }
    };

    const handleDelete = async () => {
        if (selectedClients.length === 0) return alert('Select clients first');

        const message = scope === 'corporate'
            ? 'Remove these clients from Corporate Pool? They will remain in your private list.'
            : 'Permanently delete these clients? This cannot be undone.';

        if (!window.confirm(message)) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/clients`, {
                headers: { 'x-auth-token': token },
                data: { clientIds: selectedClients, scope }
            });
            alert(scope === 'corporate' ? 'Clients unshared successfully!' : 'Clients deleted successfully!');
            setSelectedClients([]);
            dispatch(fetchClients(scope)); // Refresh list
        } catch (err) {
            console.error(err);
            alert('Delete failed');
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 relative">
            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Share to Corporate Pool</h3>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Sharing <strong>{selectedClients.length}</strong> clients. Who can see them?
                            </p>

                            <div className="space-y-3">
                                <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${shareTarget === 'all' ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="shareTarget"
                                        value="all"
                                        checked={shareTarget === 'all'}
                                        onChange={() => setShareTarget('all')}
                                        className="mt-1 text-primary focus:ring-primary"
                                    />
                                    <div className="ml-3">
                                        <span className="block text-sm font-medium text-gray-900">Everyone</span>
                                        <span className="block text-xs text-gray-500">All corporate members can view these clients.</span>
                                    </div>
                                </label>

                                <label className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${shareTarget === 'groups' ? 'border-primary bg-blue-50' : 'border-gray-200'}`}>
                                    <input
                                        type="radio"
                                        name="shareTarget"
                                        value="groups"
                                        checked={shareTarget === 'groups'}
                                        onChange={() => setShareTarget('groups')}
                                        className="mt-1 text-primary focus:ring-primary"
                                    />
                                    <div className="ml-3 w-full">
                                        <span className="block text-sm font-medium text-gray-900">Specific Groups</span>
                                        <span className="block text-xs text-gray-500">Only members of selected groups can view.</span>

                                        {shareTarget === 'groups' && (
                                            <div className="mt-3 space-y-2 border-t pt-2 border-blue-100 max-h-40 overflow-y-auto">
                                                {groups.length === 0 && <p className="text-xs text-red-500">No groups found.</p>}
                                                {groups.map(group => (
                                                    <label key={group._id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedGroups.includes(group._id)}
                                                            onChange={() => toggleGroupSelect(group._id)}
                                                            className="rounded text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-sm text-gray-700">{group.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                            <button onClick={confirmShare} className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600">Confirm Share</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">Client Directory</h2>

                <div className="flex items-center bg-white border rounded-lg p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setScope('private')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition text-sm ${scope === 'private' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        My Clients
                    </button>
                    <button
                        onClick={() => setScope('corporate')}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition text-sm ${scope === 'corporate' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Corporate Pool
                    </button>
                </div>
            </div>

            {/* Mobile Action Buttons */}
            {selectedClients.length > 0 && (
                <div className="lg:hidden flex flex-col gap-2">
                    <button onClick={openShareModal} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">
                        <Users size={18} /> Share to Corporate
                    </button>
                    <button onClick={handleDelete} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700">
                        <Trash2 size={18} /> Delete
                    </button>
                    <button onClick={sendCampaign} className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700">
                        <Send size={18} /> Send Campaign ({selectedClients.length})
                    </button>
                </div>
            )}

            {/* Desktop Search and Actions */}
            <div className="hidden lg:flex justify-between items-center">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                {selectedClients.length > 0 && (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <button onClick={openShareModal} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            <Users size={18} /> Share to Corporate
                        </button>
                        <button onClick={handleDelete} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                            <Trash2 size={18} /> Delete
                        </button>
                        <button onClick={sendCampaign} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            <Send size={18} /> Send Campaign ({selectedClients.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
                {loading ? (
                    <div className="bg-white p-6 rounded-lg shadow text-center">Loading...</div>
                ) : clients.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">No clients found.</div>
                ) : (
                    clients.map(client => (
                        <div key={client._id} className="bg-white rounded-lg shadow border border-gray-200">
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedClients.includes(client._id)}
                                        onChange={() => handleSelect(client._id)}
                                        className="mt-1 min-h-[20px] min-w-[20px]"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{client.data.name}</h3>
                                                <p className="text-sm text-gray-600">{client.data.position}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                                                    {client.data.category}
                                                </span>
                                                {/* Group Badges Mobile */}
                                                {client.shared_groups && client.shared_groups.length > 0 && (
                                                    <div className="flex flex-wrap justify-end gap-1">
                                                        {client.shared_groups.map(g => (
                                                            <span key={g._id} className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                                                                {g.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <p className="font-medium text-gray-700">{client.data.company_name}</p>
                                                <p className="text-gray-500 text-xs">{client.data.company_address}</p>
                                            </div>

                                            <div className="pt-2 border-t border-gray-100">
                                                <p className="text-gray-900">{client.data.email}</p>
                                                <p className="text-gray-600">{client.data.phone}</p>
                                            </div>

                                            {client.data.company_background && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <button
                                                        onClick={() => setExpandedClient(expandedClient === client._id ? null : client._id)}
                                                        className="flex items-center gap-1 text-blue-600 text-xs font-medium"
                                                    >
                                                        Company Background
                                                        {expandedClient === client._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                    {expandedClient === client._id && (
                                                        <p className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                                            {client.data.company_background}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                <input type="checkbox" />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Position</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direct Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                        ) : clients.length === 0 ? (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No clients found.</td></tr>
                        ) : (
                            clients.map(client => (
                                <tr key={client._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedClients.includes(client._id)}
                                            onChange={() => handleSelect(client._id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{client.data.name}</div>
                                        <div className="text-sm text-gray-500">{client.data.position}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.data.company_name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{client.data.company_address}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.data.email}</div>
                                        <div className="text-sm text-gray-500">{client.data.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${client.visibility === 'Shared' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {client.visibility === 'Shared' ? 'Corporate' : client.data.category}
                                            </span>

                                            {/* Group Badges Desktop */}
                                            {client.visibility === 'Shared' && client.shared_groups && client.shared_groups.length > 0 && (
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className="text-[10px] text-gray-500">Shared to:</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.shared_groups.map(g => (
                                                            <span key={g._id} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                {g.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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

export default ClientList;
