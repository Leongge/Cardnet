import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { LayoutDashboard, Users, LogOut, Camera, ShieldCheck, Menu, X } from 'lucide-react';

const Layout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    if (!user && !localStorage.getItem('token')) {
        // Simple protect (also handled in App.jsx usually or RequireAuth component)
        // But useEffect/Navigate is better
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-dark text-white flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Mobile Close Button */}
                <div className="flex items-center justify-between p-4">
                    <div className="text-2xl font-bold text-primary">Cardnet</div>
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden text-white hover:text-gray-300 p-2"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/app/dashboard" onClick={closeSidebar} className="flex items-center space-x-3 p-3 rounded hover:bg-white/10">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/app/clients" onClick={closeSidebar} className="flex items-center space-x-3 p-3 rounded hover:bg-white/10">
                        <Users size={20} />
                        <span>Clients</span>
                    </Link>
                    <Link to="/app/vcard-editor" onClick={closeSidebar} className="flex items-center space-x-3 p-3 rounded hover:bg-white/10 text-blue-400">
                        <Users size={20} />
                        <span>My VCard</span>
                    </Link>
                    <div className="pt-4 border-t border-gray-700">
                        {user?.role === 'CorporateAdmin' && (
                            <Link to="/app/team" onClick={closeSidebar} className="flex items-center space-x-3 p-3 rounded hover:bg-white/10 text-yellow-500">
                                <Users size={20} />
                                <span>Manage Team</span>
                            </Link>
                        )}
                        {user?.role === 'Admin' && (
                            <Link to="/app/platform" onClick={closeSidebar} className="flex items-center space-x-3 p-3 rounded hover:bg-white/10 text-red-400">
                                <ShieldCheck size={20} />
                                <span>Platform Admin</span>
                            </Link>
                        )}
                        <Link to="/app/review" onClick={closeSidebar} className="flex items-center space-x-3 p-3 rounded hover:bg-white/10 text-gray-400">
                            <Camera size={20} />
                            <span>Scan Business Cards</span>
                        </Link>
                    </div>
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <div className="text-sm mb-2">{user?.name}</div>
                    <button onClick={handleLogout} className="flex items-center space-x-3 text-red-400 hover:text-red-300">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-700 hover:text-gray-900 p-2"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-semibold">CRM Workspace</h1>
                    </div>
                </header>
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
