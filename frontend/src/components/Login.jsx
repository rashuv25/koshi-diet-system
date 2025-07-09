// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import Spinner from './Spinner';
import Toast from './Toast';
import './Login.css';

const Login = () => {
    const { login, showToast, API_BASE_URL } = useAuth();
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            const user = res.data.user;
            const token = res.data.token;

            // Ensure user object has a role property
            if (!user.role) {
                showToast('Login failed: user role missing', 'error');
                setLoading(false);
                return;
            }

            login(user, token);
            showToast(res.data.message, 'success');
        } catch (error) {
            console.error("Login error details:", {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            showToast(error.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        showToast("Password reset link (simulated) sent to your email. Check your inbox.", 'success');
        console.log(`SIMULATED: A password reset attempt for email: ${email} has been processed.`);
        setLoading(false);
        setIsForgotPassword(false);
        setEmail('');
    };

    return (
        <div className="login-page-container">
            {loading && <Spinner />}

            <div className="card">
                <img
                    src={KoshiHospitalLogo}
                    alt="Koshi Hospital Logo"
                    className="logo"
                />

                <h1 className="main-title">
                    Patient's Diet System
                </h1>
                <h2 className="form-title">
                    {isForgotPassword ? 'Forgot Password?' : 'Login'}
                </h2>

                {isForgotPassword ? (
                    <form onSubmit={handleForgotPassword} className="form-layout">
                        <div className="form-group">
                            <label htmlFor="forgot-email" className="label">
                                Enter your Email
                            </label>
                            <input
                                type="email"
                                id="forgot-email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="Email Address"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                        <div className="link-group">
                            <span
                                onClick={() => { setIsForgotPassword(false); setEmail(''); }}
                                className="link-text"
                            >
                                Back to Login
                            </span>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="form-layout">
                        <div className="form-group">
                            <label htmlFor="email" className="label">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="Email Address"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className="label">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="Password"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={loading}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                        <div className="link-group">
                            <p>
                                <span
                                    onClick={() => { setIsForgotPassword(true); setEmail(''); setPassword(''); }}
                                    className="link-text"
                                >
                                    Forgot Password?
                                </span>
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
