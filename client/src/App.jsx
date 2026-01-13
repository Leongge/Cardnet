import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ScanReview from './pages/ScanReview';
import ClientList from './pages/ClientList';
import ManageTeam from './pages/ManageTeam';
import PlatformDashboard from './pages/PlatformDashboard';
import PublicVCard from './pages/PublicVCard';
import VCardEditor from './pages/VCardEditor';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="review" element={<ScanReview />} />
                    <Route path="clients" element={<ClientList />} />
                    <Route path="team" element={<ManageTeam />} />
                    <Route path="platform" element={<PlatformDashboard />} />
                    <Route path="vcard-editor" element={<VCardEditor />} />
                </Route>
                <Route path="/u/:slug" element={<PublicVCard />} />
            </Routes>
        </Router>
    )
}

export default App
