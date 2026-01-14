import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Phone, MapPin, Globe, Linkedin, Twitter, Facebook, Instagram, Share2, UserPlus, Download, Briefcase, ChevronRight, Smartphone, Save, Eye, Sparkles, RotateCcw } from 'lucide-react';
import API_URL from '../config';

const VCardEditor = () => {
    const [formData, setFormData] = useState({
        name: '',
        position: '',
        company_name: '',
        company_address: '',
        company_website: '',
        email: '',
        phone: '',
        bio: '',
        vcard_slug: '',
        profile_picture: '',
        background_picture: '',
        social_links: {
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: ''
        }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [uploading, setUploading] = useState(false);

    // AI Design states
    const [designPrompt, setDesignPrompt] = useState('');
    const [generatingDesign, setGeneratingDesign] = useState(false);
    const [previewDesign, setPreviewDesign] = useState(null);
    const [designMessage, setDesignMessage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/vcard/profile`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data) {
                // Ensure social_links object exists even if backend returns partial data
                const mergedData = {
                    ...res.data,
                    social_links: {
                        linkedin: '',
                        twitter: '',
                        facebook: '',
                        instagram: '',
                        ...(res.data.social_links || {})
                    }
                };
                setFormData(mergedData);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleImageUpload = async (e, field = 'profile_picture') => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const res = await axios.post(`${API_URL}/api/vcard/upload`, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setFormData(prev => ({ ...prev, [field]: res.data.url }));
            setMessage({ type: 'success', text: `${field === 'profile_picture' ? 'Profile' : 'Background'} image uploaded successfully` });
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.message || 'Image upload failed';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('social_')) {
            const socialPlatform = name.split('_')[1];
            setFormData(prev => ({
                ...prev,
                social_links: {
                    ...prev.social_links,
                    [socialPlatform]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await axios.put(`${API_URL}/api/vcard/profile`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setMessage({ type: 'success', text: 'vCard Profile Updated Successfully' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleGenerateDesign = async () => {
        if (!designPrompt.trim()) {
            setDesignMessage({ type: 'error', text: 'Please enter a design description' });
            setTimeout(() => setDesignMessage(null), 3000);
            return;
        }

        setGeneratingDesign(true);
        try {
            const res = await axios.post(`${API_URL}/api/vcard/design/generate`,
                { prompt: designPrompt },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setPreviewDesign(res.data.design_config);
            setDesignMessage({ type: 'success', text: 'Design generated! Preview below.' });
            setTimeout(() => setDesignMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setDesignMessage({ type: 'error', text: 'Failed to generate design' });
            setTimeout(() => setDesignMessage(null), 3000);
        } finally {
            setGeneratingDesign(false);
        }
    };

    const handleSaveDesign = async () => {
        if (!previewDesign) return;

        try {
            await axios.post(`${API_URL}/api/vcard/design/save`,
                { design_config: previewDesign },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setDesignMessage({ type: 'success', text: 'Design saved successfully!' });
            setTimeout(() => setDesignMessage(null), 3000);
            // Reload to apply design
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error(err);
            setDesignMessage({ type: 'error', text: 'Failed to save design' });
            setTimeout(() => setDesignMessage(null), 3000);
        }
    };

    const handleResetDesign = async () => {
        try {
            await axios.post(`${API_URL}/api/vcard/design/reset`, {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setPreviewDesign(null);
            setDesignPrompt('');
            setDesignMessage({ type: 'success', text: 'Design reset to default!' });
            setTimeout(() => setDesignMessage(null), 3000);
            // Reload to apply design
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            console.error(err);
            setDesignMessage({ type: 'error', text: 'Failed to reset design' });
            setTimeout(() => setDesignMessage(null), 3000);
        }
    };


    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
            <div className="flex flex-col lg:flex-row h-screen overflow-hidden">

                {/* Editor Panel */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 border-r border-slate-200">
                    <div className="max-w-3xl mx-auto">

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">vCard Editor</h1>
                                <p className="text-slate-500 mt-1">Manage your digital business card details.</p>
                            </div>
                            <div className="hidden md:flex items-center gap-2 text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                Live Sync Active
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Identity Section */}
                            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-100">
                                    <UserPlus size={20} className="text-amber-500" />
                                    Identity & Role
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Link / Username</label>
                                        <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all">
                                            <div className="px-4 py-3 bg-slate-100 border-r border-slate-200 text-slate-500 text-sm font-medium">
                                                cardnet.vercel.app/u/
                                            </div>
                                            <input
                                                type="text"
                                                name="vcard_slug"
                                                value={formData.vcard_slug || ''}
                                                onChange={handleChange}
                                                className="flex-1 bg-transparent px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400"
                                                placeholder="john-doe"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Ex. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Position / Title</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Ex. Chief Executive Officer"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Picture</label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-16 h-16 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                                {formData.profile_picture ? (
                                                    <img src={formData.profile_picture.startsWith('http') ? formData.profile_picture : `${API_URL}${formData.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                        <UserPlus size={24} />
                                                    </div>
                                                )}
                                                {uploading && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'profile_picture')}
                                                    id="profile-upload"
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="profile-upload"
                                                    className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <Download size={16} className="rotate-180" />
                                                    Upload New Photo
                                                </label>
                                                <p className="text-[10px] text-slate-400 mt-1">Recommended: Square JPG/PNG, max 5MB.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cover Photo (Background)</label>
                                        <div className="space-y-3">
                                            <div className="relative w-full h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                                                {formData.background_picture ? (
                                                    <img src={formData.background_picture.startsWith('http') ? formData.background_picture : `${API_URL}${formData.background_picture}`} alt="Background" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
                                                        <span className="text-xs">No cover photo uploaded</span>
                                                    </div>
                                                )}
                                                {uploading && (
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, 'background_picture')}
                                                    id="background-upload"
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="background-upload"
                                                    className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <Download size={16} className="rotate-180" />
                                                    Upload Cover Photo
                                                </label>
                                                <p className="text-[10px] text-slate-400 mt-1">Recommended: 1200x400 JPG/PNG.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Bio</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleChange}
                                            rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 resize-none"
                                            placeholder="A brief introduction..."
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Contact Section */}
                            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-100">
                                    <Briefcase size={20} className="text-amber-500" />
                                    Company & Contact
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                                        <input
                                            type="text"
                                            name="company_name"
                                            value={formData.company_name}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Ex. Cardnet Corp"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Website</label>
                                        <input
                                            type="text"
                                            name="company_website"
                                            value={formData.company_website}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="+60 12-345 6789"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="you@company.com"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</label>
                                        <input
                                            type="text"
                                            name="company_address"
                                            value={formData.company_address}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="123 Business Blvd, Suite 100"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Social Section */}
                            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-slate-100">
                                    <Share2 size={20} className="text-amber-500" />
                                    Social Presence
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">LinkedIn</label>
                                        <input
                                            type="text"
                                            name="social_linkedin"
                                            value={formData.social_links.linkedin}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Profile URL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Twitter / X</label>
                                        <input
                                            type="text"
                                            name="social_twitter"
                                            value={formData.social_links.twitter}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Profile URL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facebook</label>
                                        <input
                                            type="text"
                                            name="social_facebook"
                                            value={formData.social_links.facebook}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Profile URL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instagram</label>
                                        <input
                                            type="text"
                                            name="social_instagram"
                                            value={formData.social_links.instagram}
                                            onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="Profile URL"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* AI Design Section */}
                            <section className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-200 shadow-sm">
                                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-6 pb-4 border-b border-purple-100">
                                    <Sparkles size={20} className="text-purple-500" />
                                    AI Design Customization
                                </h2>

                                {designMessage && (
                                    <div className={`mb-4 p-3 rounded-lg text-sm ${designMessage.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {designMessage.text}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Describe Your Style</label>
                                        <input
                                            type="text"
                                            value={designPrompt}
                                            onChange={(e) => setDesignPrompt(e.target.value)}
                                            className="w-full bg-white border border-purple-200 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all placeholder:text-slate-400"
                                            placeholder="e.g., professional business, tech startup, creative agency..."
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGenerateDesign}
                                        disabled={generatingDesign}
                                        className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 disabled:opacity-50"
                                    >
                                        {generatingDesign ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={18} />
                                                Generate Design
                                            </>
                                        )}
                                    </button>

                                    {previewDesign && (
                                        <div className="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Preview Colors</p>
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                <div className="space-y-1">
                                                    <div className="h-12 rounded-lg border border-slate-200" style={{ backgroundColor: previewDesign.primary_color }}></div>
                                                    <p className="text-xs text-slate-500 text-center">Primary</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="h-12 rounded-lg border border-slate-200" style={{ backgroundColor: previewDesign.secondary_color }}></div>
                                                    <p className="text-xs text-slate-500 text-center">Secondary</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="h-12 rounded-lg border border-slate-200" style={{ backgroundColor: previewDesign.accent_color }}></div>
                                                    <p className="text-xs text-slate-500 text-center">Accent</p>
                                                </div>
                                            </div>
                                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Design Settings</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div><span className="text-slate-400">Layout:</span> <span className="font-medium">{previewDesign.layout_style}</span></div>
                                                    <div><span className="text-slate-400">Font:</span> <span className="font-medium">{previewDesign.font_family}</span></div>
                                                    <div><span className="text-slate-400">Spacing:</span> <span className="font-medium">{previewDesign.spacing}</span></div>
                                                    <div><span className="text-slate-400">Shape:</span> <span className="font-medium">{previewDesign.card_shape}</span></div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleSaveDesign}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors"
                                                >
                                                    <Save size={16} />
                                                    Save Design
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleResetDesign}
                                                    className="flex items-center justify-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-300 transition-colors"
                                                >
                                                    <RotateCcw size={16} />
                                                    Reset
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="pt-4 flex items-center justify-end gap-4">
                                <a
                                    href={`/u/${formData.vcard_slug || formData.url_slug || 'preview'}`}
                                    target="_blank"
                                    className="flex items-center gap-2 px-6 py-3 text-slate-600 font-semibold hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <Eye size={20} />
                                    View Live Card
                                </a>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold tracking-wide hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            SAVING...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            SAVE CHANGES
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="h-24"></div>
                </div>

                {/* Live Preview Panel */}
                <div className="hidden lg:flex w-[500px] bg-slate-100 flex-col items-center justify-center p-8 border-l border-slate-200 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <div className="relative z-10 text-center mb-8">
                        <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                            <Smartphone size={16} />
                            Live Preview
                        </h3>
                    </div>

                    {/* Device Frame */}
                    <div className="relative mx-auto border-8 border-slate-900 bg-slate-900 rounded-[3rem] h-[700px] w-[360px] shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
                        <div className="h-full w-full bg-slate-50 relative overflow-y-auto custom-scrollbar">

                            {/* ----- PREVIEW CONTENT STARTS (Matches PublicVCard Light) ----- */}

                            {/* Header / Cover */}
                            <div className="h-44 relative overflow-hidden" style={{
                                backgroundColor: previewDesign?.primary_color || '#1e293b',
                                borderRadius: previewDesign?.card_shape === 'sharp' ? '0' : previewDesign?.card_shape === 'pill' ? '2rem 2rem 0 0' : '0'
                            }}>
                                {formData.background_picture ? (
                                    <img
                                        src={formData.background_picture.startsWith('http') ? formData.background_picture : `${API_URL}${formData.background_picture}`}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                ) : !previewDesign && (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950"></div>
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                                    </>
                                )}
                                {previewDesign?.show_decorations && previewDesign && (
                                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" style={{
                                        backgroundColor: previewDesign.secondary_color,
                                        opacity: 0.2
                                    }}></div>
                                )}
                            </div>

                            <div className="px-6 pb-12 -mt-20 relative flex-1 flex flex-col">

                                {/* Profile Picture */}
                                <div className="relative mx-auto w-32 h-32 mb-4">
                                    <div className="absolute inset-0 rounded-full bg-white p-[3px] shadow-xl">
                                        <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden border border-slate-100">
                                            {formData.profile_picture ? (
                                                <img src={formData.profile_picture.startsWith('http') ? formData.profile_picture : `${API_URL}${formData.profile_picture}`} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 text-slate-400">
                                                    {formData.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Intro */}
                                <div className={previewDesign?.spacing === 'compact' ? 'text-center mb-4' : previewDesign?.spacing === 'spacious' ? 'text-center mb-12' : 'text-center mb-8'} style={{
                                    fontFamily: previewDesign?.font_family === 'classic' ? 'Georgia, serif' : previewDesign?.font_family === 'playful' ? '"Comic Sans MS", cursive' : 'Inter, sans-serif'
                                }}>
                                    <h1 className="font-bold text-slate-900 mb-1 tracking-tight" style={{
                                        fontSize: previewDesign?.heading_size === 'small' ? '1.125rem' : previewDesign?.heading_size === 'large' ? '1.5rem' : '1.25rem',
                                        color: previewDesign?.text_color || '#0f172a'
                                    }}>{formData.name || 'Your Name'}</h1>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{
                                        color: previewDesign?.secondary_color || '#f59e0b'
                                    }}>{formData.position || 'Your Position'}</p>
                                    <p className="text-slate-500 text-xs font-medium">{formData.company_name || 'Company Name'}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className={`grid grid-cols-2 gap-3 ${previewDesign?.spacing === 'compact' ? 'mb-4' : previewDesign?.spacing === 'spacious' ? 'mb-12' : 'mb-8'}`}>
                                    <button className="flex items-center justify-center gap-2 text-white py-3 font-semibold text-xs shadow-lg" style={{
                                        backgroundColor: previewDesign?.primary_color || '#1e293b',
                                        borderRadius: previewDesign?.card_shape === 'sharp' ? '0.25rem' : previewDesign?.card_shape === 'pill' ? '2rem' : '0.75rem'
                                    }}>
                                        <Download size={14} />
                                        Save
                                    </button>
                                    <button className="flex items-center justify-center gap-2 bg-white border py-3 font-semibold text-xs shadow-sm" style={{
                                        borderColor: previewDesign?.accent_color || '#3b82f6',
                                        color: previewDesign?.accent_color || '#3b82f6',
                                        borderRadius: previewDesign?.card_shape === 'sharp' ? '0.25rem' : previewDesign?.card_shape === 'pill' ? '2rem' : '0.75rem'
                                    }}>
                                        <UserPlus size={14} />
                                        Connect
                                    </button>
                                </div>

                                {/* Info List */}
                                <div className="space-y-3 mb-8">
                                    {formData.bio && (
                                        <div className="text-center mb-6 px-2">
                                            <p className="text-slate-500 text-xs leading-relaxed italic border-l-2 border-amber-200 pl-3 py-1 text-left bg-slate-50/50 rounded-r-lg">
                                                "{formData.bio}"
                                            </p>
                                        </div>
                                    )}

                                    {formData.phone && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 shadow-sm">
                                                <Phone size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Mobile</p>
                                                <p className="text-slate-800 font-medium text-xs">{formData.phone}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                    )}

                                    {formData.email && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 shadow-sm">
                                                <Mail size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Email</p>
                                                <p className="text-slate-800 font-medium text-xs">{formData.email}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                    )}

                                    {formData.company_website && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 border border-slate-200 shadow-sm">
                                                <Globe size={14} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Website</p>
                                                <p className="text-slate-800 font-medium text-xs truncate max-w-[140px]">{formData.company_website.replace(/^https?:\/\//, '')}</p>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {formData.social_links && (
                                    <div className="flex justify-center gap-4 pt-6 border-t border-slate-100 mb-6">
                                        {formData.social_links.linkedin && (
                                            <a href={formData.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                                                <Linkedin size={18} />
                                            </a>
                                        )}
                                        {formData.social_links.twitter && (
                                            <a href={formData.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                                                <Twitter size={18} />
                                            </a>
                                        )}
                                        {formData.social_links.facebook && (
                                            <a href={formData.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                                                <Facebook size={18} />
                                            </a>
                                        )}
                                        {formData.social_links.instagram && (
                                            <a href={formData.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors">
                                                <Instagram size={18} />
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="text-center pb-6">
                                    <div className="inline-flex items-center justify-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                                        <span className="text-[8px] text-slate-400 font-medium uppercase tracking-widest">Cardnet Business</span>
                                    </div>
                                </div>
                            </div>

                            {/* ----- PREVIEW CONTENT ENDS ----- */}

                        </div>
                        {/* Device Notch & Home Bar props */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-slate-800 rounded-full z-20"></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VCardEditor;
