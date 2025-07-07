// user-client/src/App.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import VendorDashboard from './components/VendorDashboard';
import Toast from './components/Toast';
import Spinner from './components/Spinner';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Context for managing authentication state globally
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Base URL for your backend API- change
const API_BASE_URL = import.meta.env.VITE_API_URL;

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.role === 'user') { // Only load if it's a user role for this client
                    setUser(parsedUser);
                    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                } else {
                    localStorage.clear();
                }
            } catch (error) {
                console.error("Failed to parse stored user data:", error);
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
        setToastMessage('Logged out successfully.');
        setToastType('success');
    };

    const showToast = (message, type) => {
        setToastMessage(message);
        setToastType(type);
    };

    const clearToast = () => {
        setToastMessage('');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, showToast, API_BASE_URL }}>
            {children}
            <Toast message={toastMessage} type={toastType} onClose={clearToast} />
        </AuthContext.Provider>
    );
};

const App = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Spinner />;
    }

    return (
        <div className="min-h-screen app-container">
            {user ? (
                user.role === 'admin' ? (
                    <AdminDashboard />
                ) : user.role === 'vendor' ? (
                    <VendorDashboard />
                ) : (
                    <UserDashboard />
                )
            ) : (
                <Login />
            )}
        </div>
    );
};

export default function AppWrapper() {
    const theme = createTheme({
        palette: {
            primary: { main: '#1976d2' },
            secondary: { main: '#9c27b0' },
        },
    });
    return (
        <ThemeProvider theme={theme}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </ThemeProvider>
    );
}