import React, { useState, useRef } from 'react';
import { Upload, Check, Save, Camera, X, RotateCcw } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

const ScanReview = () => {
    const [file, setFile] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState([]);
    const [cameraActive, setCameraActive] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const startCamera = async () => {
        try {
            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            console.log('Camera stream obtained');
            streamRef.current = stream;

            // Set camera active FIRST to render the video element
            setCameraActive(true);

            // Wait for React to render the video element
            setTimeout(() => {
                console.log('Checking videoRef:', videoRef.current);
                if (videoRef.current) {
                    console.log('Setting video srcObject...');
                    videoRef.current.srcObject = stream;

                    // Wait for metadata to load before playing
                    videoRef.current.onloadedmetadata = () => {
                        console.log('Video metadata loaded, dimensions:',
                            videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                        videoRef.current.play()
                            .then(() => {
                                console.log('Video playing');
                            })
                            .catch(err => {
                                console.error('Play error:', err);
                                alert('Failed to play video: ' + err.message);
                            });
                    };
                } else {
                    console.error('videoRef is still null!');
                }
            }, 100);
        } catch (err) {
            console.error('Camera error:', err);
            alert('Camera access failed: ' + err.message);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);

            canvas.toBlob((blob) => {
                const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
                setFile(file);
                setImagePreview(canvas.toDataURL('image/jpeg'));
                stopCamera();
            }, 'image/jpeg', 0.95);
        }
    };

    const clearImage = () => {
        setFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleScan = async () => {
        if (!file) return;
        setScanning(true);

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Direct axios call or use thunk. Direct is fine for this specific mock action.
            // Note: We need token middleware on server? server/routes/scan.js didn't use 'auth' middleware so it's public for now (or I should add it).
            // Let's assume it's public for simplicity of mock.
            const res = await axios.post(`${API_URL}/api/scan/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(res.data);
        } catch (err) {
            console.error(err);
            alert('Scan failed');
        } finally {
            setScanning(false);
        }
    };

    const handleSave = async (card, index) => {
        try {
            const token = localStorage.getItem('token');

            // Debug token
            console.log('Token exists:', !!token);
            console.log('Token value:', token);

            if (!token) {
                alert('You are not logged in. Please login again.');
                navigate('/login');
                return;
            }

            // Prepare the data to send to the server
            const clientData = {
                name: card.name,
                position: card.position,
                email: card.email,
                phone: card.phone,
                company: card.company,
                address: card.address,
                category: card.category,
                companyBackground: card.companyBackground,
                visibility: card.visibility || 'Private',
                source: 'Scan'
            };

            console.log('Sending client data:', clientData);

            await axios.post(`${API_URL}/api/clients`, clientData, {
                headers: { 'x-auth-token': token }
            });

            // Remove from list or mark saved
            const newResults = [...results];
            newResults.splice(index, 1);
            setResults(newResults);

            if (newResults.length === 0) {
                alert('All cards saved!');
                navigate('/clients');
            }
        } catch (err) {
            console.error('Save error:', err);
            console.error('Error response:', err.response?.data);

            if (err.response?.status === 401) {
                alert('Your session has expired. Please login again.');
                navigate('/login');
            } else {
                alert(`Error saving card: ${err.response?.data?.msg || err.message}`);
            }
        }
    };

    const handleFieldChange = (index, field, value) => {
        const newResults = [...results];
        newResults[index][field] = value;
        setResults(newResults);
    };

    return (
        <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <h2 className="text-xl sm:text-2xl font-bold">Scan Business Cards</h2>

            {/* Upload/Camera Section */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                {/* Camera View */}
                {cameraActive && (
                    <div className="mb-4">
                        <div className="relative bg-black rounded-lg overflow-hidden">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-auto"
                            />
                            <button
                                onClick={stopCamera}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <button
                            onClick={capturePhoto}
                            className="mt-4 w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 font-medium min-h-[44px]"
                        >
                            <Camera size={20} /> Capture Photo
                        </button>
                    </div>
                )}

                {/* Image Preview */}
                {imagePreview && !cameraActive && (
                    <div className="mb-4">
                        <div className="relative">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-auto rounded-lg border-2 border-gray-300"
                            />
                            <button
                                onClick={clearImage}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {!cameraActive && !imagePreview && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={startCamera}
                            className="bg-blue-500 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 font-medium min-h-[44px] sm:min-h-0"
                        >
                            <Camera size={20} /> Take Photo
                        </button>
                        <label className="bg-gray-500 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 font-medium min-h-[44px] sm:min-h-0 cursor-pointer">
                            <Upload size={20} /> Upload Image
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Process Button */}
                {imagePreview && !cameraActive && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleScan}
                            disabled={!file || scanning}
                            className="flex-1 bg-green-500 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium min-h-[44px] sm:min-h-0"
                        >
                            {scanning ? 'Scanning...' : <><Upload size={18} /> Process Image</>}
                        </button>
                        <button
                            onClick={clearImage}
                            className="bg-gray-500 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2 font-medium min-h-[44px] sm:min-h-0"
                        >
                            <RotateCcw size={18} /> Retake
                        </button>
                    </div>
                )}

                {scanning && <div className="mt-4 text-blue-600 animate-pulse text-sm sm:text-base">AI is extracting details...</div>}
            </div>

            {/* Results Section */}
            {results.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {results.map((card, idx) => (
                        <div key={idx} className="bg-white p-4 sm:p-5 rounded-lg shadow border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">Draft</span>
                                <span className="text-gray-400 text-xs">#{idx + 1}</span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1 sm:hidden">Name</label>
                                    <input
                                        value={card.name || ''}
                                        onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                        placeholder="Name"
                                        className="w-full border border-gray-300 p-2 sm:p-1 rounded font-bold text-base sm:text-sm min-h-[44px] sm:min-h-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1 sm:hidden">Position</label>
                                    <input
                                        value={card.position || ''}
                                        onChange={(e) => handleFieldChange(idx, 'position', e.target.value)}
                                        placeholder="Position"
                                        className="w-full border border-gray-300 p-2 sm:p-1 rounded text-base sm:text-sm text-gray-600 min-h-[44px] sm:min-h-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1 sm:hidden">Company</label>
                                    <input
                                        value={card.company || ''}
                                        onChange={(e) => handleFieldChange(idx, 'company', e.target.value)}
                                        placeholder="Company Name"
                                        className="w-full border border-gray-300 p-2 sm:p-1 rounded text-base sm:text-sm min-h-[44px] sm:min-h-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Company Background (AI)</label>
                                    <textarea
                                        value={card.companyBackground || ''}
                                        onChange={(e) => handleFieldChange(idx, 'companyBackground', e.target.value)}
                                        placeholder="Company Background (AI Generated)"
                                        className="w-full border border-gray-300 p-2 rounded text-sm text-gray-700 bg-blue-50"
                                        rows="6"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1 sm:hidden">Email</label>
                                    <input
                                        value={card.email || ''}
                                        onChange={(e) => handleFieldChange(idx, 'email', e.target.value)}
                                        placeholder="Email"
                                        type="email"
                                        className="w-full border border-gray-300 p-2 sm:p-1 rounded text-base sm:text-sm min-h-[44px] sm:min-h-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1 sm:hidden">Phone</label>
                                    <input
                                        value={card.phone || ''}
                                        onChange={(e) => handleFieldChange(idx, 'phone', e.target.value)}
                                        placeholder="Phone"
                                        type="tel"
                                        className="w-full border border-gray-300 p-2 sm:p-1 rounded text-base sm:text-sm min-h-[44px] sm:min-h-0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Visibility</label>
                                    <select
                                        value={card.visibility || 'Private'}
                                        onChange={(e) => handleFieldChange(idx, 'visibility', e.target.value)}
                                        className="w-full border border-gray-300 p-2 sm:p-1 rounded text-base sm:text-sm min-h-[44px] sm:min-h-0"
                                    >
                                        <option value="Private">Private</option>
                                        <option value="Shared">Shared (Corporate)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSave(card, idx)}
                                className="mt-4 w-full bg-green-500 text-white py-3 sm:py-2 rounded-lg hover:bg-green-600 active:bg-green-700 flex justify-center items-center gap-2 font-medium min-h-[44px] sm:min-h-0 transition-colors"
                            >
                                <Check size={18} /> Confirm & Save
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ScanReview;
