import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Phone, MapPin, Globe, Linkedin, Twitter, Facebook, Instagram, Share2, UserPlus, Download, Briefcase, ChevronRight } from 'lucide-react';
import API_URL from '../config';

const PublicVCard = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [connectLoading, setConnectLoading] = useState(false);
    const [connectMessage, setConnectMessage] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/vcard/${slug}`);
                setUser(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching vCard:', err);
                setError('Profile not found');
                setLoading(false);
            }
        };

        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await axios.get(`${API_URL}/api/vcard/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setIsAuthenticated(true);
                    setCurrentUserId(res.data._id);
                } catch (err) {
                    console.error('Auth check failed:', err);
                    setIsAuthenticated(false);
                }
            }
        };

        fetchUser();
        checkAuth();
    }, [slug]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800">
            <h1 className="text-2xl font-serif mb-2">Unavailable</h1>
            <p className="text-slate-500">{error}</p>
        </div>
    );

    const {
        name, position, company_name, company_address, company_website,
        email, phone, bio, profile_picture, background_picture, social_links
    } = user;

    const handleDownloadVCard = () => {
        const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TITLE:${position}
ORG:${company_name}
TEL;TYPE=CELL:${phone}
EMAIL:${email}
URL:${company_website}
ADR;TYPE=WORK:;;${company_address};;;;
END:VCARD`;

        const blob = new Blob([vcardData], { type: 'text/vcard' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${slug}.vcf`;
        a.click();
    };

    const handleConnect = async () => {
        // Check if authenticated
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Check if viewing own VCard
        if (user._id === currentUserId) {
            setConnectMessage({ type: 'error', text: 'You cannot connect to your own VCard' });
            setTimeout(() => setConnectMessage(null), 3000);
            return;
        }

        setConnectLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/api/vcard/connect/${slug}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setConnectMessage({ type: 'success', text: res.data.message });
            setTimeout(() => setConnectMessage(null), 3000);
        } catch (err) {
            console.error('Connect error:', err);
            const errorMsg = err.response?.data?.message || 'Failed to connect';
            setConnectMessage({ type: 'error', text: errorMsg });
            setTimeout(() => setConnectMessage(null), 3000);
        } finally {
            setConnectLoading(false);
        }
    };

    const isOwnVCard = isAuthenticated && user && user._id === currentUserId;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-6 lg:p-12 font-sans selection:bg-amber-100 selection:text-amber-900">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-100/40 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-[400px] bg-white md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden relative z-10 min-h-screen md:min-h-[800px] flex flex-col">

                {/* Header / Cover */}
                <div className="h-44 relative bg-slate-900 overflow-hidden">
                    {background_picture ? (
                        <img
                            src={background_picture.startsWith('http') ? background_picture : `${API_URL}${background_picture}`}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950"></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        </>
                    )}
                </div>

                <div className="px-8 pb-12 -mt-20 relative flex-1 flex flex-col">

                    {/* Profile Picture */}
                    <div className="relative mx-auto w-36 h-36 mb-6">
                        <div className="absolute inset-0 rounded-full bg-white p-[4px] shadow-xl">
                            <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden border border-slate-100">
                                {profile_picture ? (
                                    <img src={profile_picture.startsWith('http') ? profile_picture : `${API_URL}${profile_picture}`} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 text-slate-400">
                                        {name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Intro */}
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{name}</h1>
                        <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-2">{position}</p>
                        <p className="text-slate-500 text-sm font-medium">{company_name}</p>
                    </div>

                    {/* Connect Message */}
                    {connectMessage && (
                        <div className={`mb-6 p-3 rounded-lg text-sm text-center ${connectMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {connectMessage.text}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <button
                            onClick={handleDownloadVCard}
                            className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                        >
                            <Download size={18} />
                            Save
                        </button>
                        <button
                            onClick={handleConnect}
                            disabled={isOwnVCard || connectLoading}
                            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm ${isOwnVCard
                                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                    : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {connectLoading ? (
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                            ) : (
                                <UserPlus size={18} />
                            )}
                            {isOwnVCard ? "That's You!" : 'Connect'}
                        </button>
                    </div>

                    {/* Info List */}
                    <div className="space-y-4 mb-10">

                        {/* Bio */}
                        {bio && (
                            <div className="text-center mb-8 px-4">
                                <p className="text-slate-500 text-sm leading-relaxed italic border-l-2 border-amber-200 pl-4 py-1 text-left bg-slate-50/50 rounded-r-lg">
                                    "{bio}"
                                </p>
                            </div>
                        )}

                        {phone && (
                            <a href={`tel:${phone}`} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 group-hover:text-amber-600 transition-colors shadow-sm">
                                    <Phone size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Mobile</p>
                                    <p className="text-slate-800 font-medium">{phone}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </a>
                        )}

                        {email && (
                            <a href={`mailto:${email}`} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 group-hover:text-amber-600 transition-colors shadow-sm">
                                    <Mail size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Email</p>
                                    <p className="text-slate-800 font-medium">{email}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </a>
                        )}

                        {company_website && (
                            <a href={company_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md hover:border-slate-200 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 group-hover:text-amber-600 transition-colors shadow-sm">
                                    <Globe size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Website</p>
                                    <p className="text-slate-800 font-medium truncate max-w-[180px]">{company_website.replace(/^https?:\/\//, '')}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </a>
                        )}

                        {company_address && (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 shadow-sm">
                                    <MapPin size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Location</p>
                                    <p className="text-slate-800 font-medium">{company_address}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Socials */}
                    <div className="mt-auto">
                        {social_links && Object.values(social_links).some(l => l) && (
                            <div className="flex justify-center gap-6 pt-8 border-t border-slate-100 mb-8">
                                {social_links.linkedin && (
                                    <a href={social_links.linkedin} className="text-slate-400 hover:text-slate-900 transition-colors hover:scale-110 transform duration-200">
                                        <Linkedin size={22} />
                                    </a>
                                )}
                                {social_links.twitter && (
                                    <a href={social_links.twitter} className="text-slate-400 hover:text-slate-900 transition-colors hover:scale-110 transform duration-200">
                                        <Twitter size={22} />
                                    </a>
                                )}
                                {social_links.facebook && (
                                    <a href={social_links.facebook} className="text-slate-400 hover:text-slate-900 transition-colors hover:scale-110 transform duration-200">
                                        <Facebook size={22} />
                                    </a>
                                )}
                                {social_links.instagram && (
                                    <a href={social_links.instagram} className="text-slate-400 hover:text-slate-900 transition-colors hover:scale-110 transform duration-200">
                                        <Instagram size={22} />
                                    </a>
                                )}
                            </div>
                        )}

                        <div className="text-center pb-8">
                            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Cardnet Business</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicVCard;
