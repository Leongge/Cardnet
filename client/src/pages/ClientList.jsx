import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients } from '../store/clientSlice';
import { Search, Filter, Send, Users, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import API_URL from '../config';

const ClientList = () => {
    const dispatch = useDispatch();
    const { clients, loading } = useSelector(state => state.clients);
    const [scope, setScope] = useState('private');
    const [selectedClients, setSelectedClients] = useState([]);
    const [expandedClient, setExpandedClient] = useState(null);

    useEffect(() => {
        dispatch(fetchClients(scope));
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

    const handleShare = async () => {
        if (selectedClients.length === 0) return alert('Select clients first');
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/api/clients/share`,
                { clientIds: selectedClients },
                { headers: { 'x-auth-token': token } }
            );
            alert('Clients shared to corporate pool successfully!');
            setSelectedClients([]);
            dispatch(fetchClients(scope)); // Refresh list
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Share failed');
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
            // Axios delete with body requires 'data' key
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
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
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
                    <button onClick={handleShare} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">
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
                        <button onClick={handleShare} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
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
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                                                {client.data.category}
                                            </span>
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
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {client.data.category}
                                        </span>
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
