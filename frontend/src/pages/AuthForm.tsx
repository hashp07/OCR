import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isToggled, setIsToggled] = useState(location.state?.isSignUp || false);

    useEffect(() => {
        if (location.state?.isSignUp !== undefined) {
            setIsToggled(location.state.isSignUp);
        }
    }, [location.state]);

    // Form states
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ FIX: Uses your live Vercel environment variable, falls back to localhost for local development
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL 
    ? `${import.meta.env.VITE_BACKEND_URL}/api/users` 
    : 'http://localhost:3001/api/users';

    const handleRegisterClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsToggled(true);
        setError(null);
        setUsername(''); setEmail(''); setPassword('');
    };

    const handleLoginClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsToggled(false);
        setError(null);
        setUsername(''); setEmail(''); setPassword('');
    };

    // --- 1. HANDLE LOGIN ---
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || (data.errors && data.errors[0]?.msg) || 'Login failed';
                throw new Error(errorMessage);
            }

            localStorage.setItem('token', data.token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 2. HANDLE REGISTRATION ---
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error || (data.errors && data.errors[0]?.msg) || 'Registration failed';
                throw new Error(errorMessage);
            }

            localStorage.setItem('token', data.token);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
                integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />

            <div className={`auth-wrapper ${isToggled ? 'toggled' : ''}`}>
                <div className="background-shape">
                    <div className="scanner-line"></div>
                </div>
                <div className="secondary-shape"></div>
                
                {/* LOGIN PANEL */}
                <div className="credentials-panel signin">
                    <h2 className="slide-element">Login</h2>
                    
                    {!isToggled && error && <div className="error-message slide-element">{error}</div>}

                    <form onSubmit={handleLoginSubmit}>
                        <div className="field-wrapper slide-element">
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                            <label htmlFor="">Email</label>
                            <i className="fa-solid fa-envelope"></i>
                        </div>

                        <div className="field-wrapper slide-element">
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <label htmlFor="">Password</label>
                            <i className="fa-solid fa-lock"></i>
                        </div>

                        <div className="field-wrapper slide-element">
                            <button className="submit-button" type="submit" disabled={isLoading}>
                                {isLoading ? 'Processing...' : 'Access Workspace'}
                            </button>
                        </div>

                        <div className="switch-link slide-element">
                            <p>Don't have an account? <br /> 
                                <a href="#" className="register-trigger" onClick={handleRegisterClick}>Sign Up</a>
                            </p>
                        </div>
                    </form>
                </div>

                {/* LOGIN WELCOME GRAPHICS */}
                <div className="welcome-section signin">
                    <div className="slide-element thematic-icon">
                        <i className="fa-solid fa-file-invoice"></i>
                        <i className="fa-solid fa-crop-simple overlay-icon"></i>
                    </div>
                    <h2 className="slide-element">WELCOME BACK!</h2>
                    <p className="slide-element ">Ready to extract some data?</p>
                </div>

                {/* SIGNUP PANEL */}
                <div className="credentials-panel signup">
                    <h2 className="slide-element">Register</h2>

                    {isToggled && error && <div className="error-message slide-element">{error}</div>}

                    <form onSubmit={handleRegisterSubmit}>
                        <div className="field-wrapper slide-element">
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required 
                            />
                            <label htmlFor="">Username</label>
                            <i className="fa-solid fa-user"></i>
                        </div>

                        <div className="field-wrapper slide-element">
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                            <label htmlFor="">Email</label>
                            <i className="fa-solid fa-envelope"></i>
                        </div>

                        <div className="field-wrapper slide-element">
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                            <label htmlFor="">Password</label>
                            <i className="fa-solid fa-lock"></i>
                        </div>

                        <div className="field-wrapper slide-element">
                            <button className="submit-button" type="submit" disabled={isLoading}>
                                {isLoading ? 'Processing...' : 'Start Scanning'}
                            </button>
                        </div>

                        <div className="switch-link slide-element">
                            <p>Already have an account? <br /> 
                                <a href="#" className="login-trigger" onClick={handleLoginClick}>Sign In</a>
                            </p>
                        </div>
                    </form>
                </div>

                {/* SIGNUP WELCOME GRAPHICS */}
                <div className="welcome-section signup">
                    <div className="slide-element thematic-icon">
                        <i className="fa-solid fa-file-lines"></i>
                        <i className="fa-solid fa-wand-magic-sparkles overlay-icon"></i>
                    </div>
                    <h2 className="slide-element">JOIN US!</h2>
                    <p className="slide-element theme-subtitle">Automate document processing.</p>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

                :root {
                    --primary-bg: #110f1a;
                    --violet-glow: #8a2be2; 
                    --violet-dark: #4b0082;
                    --violet-accent: #c060ff; 
                }

                body {
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    background: var(--primary-bg);
                }

                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Poppins', sans-serif;
                    color: #fff;
                }

                .error-message {
                    background-color: rgba(255, 0, 0, 0.1);
                    color: #ff4d4d;
                    border: 1px solid #ff4d4d;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 14px;
                    margin-bottom: 15px;
                    box-shadow: 0 0 10px rgba(255, 0, 0, 0.2);
                }

                button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .auth-wrapper {
                    position: relative;
                    width: 100vw;
                    height: 100vh;
                    background: var(--primary-bg);
                    overflow: hidden;
                }

                .auth-wrapper .credentials-panel {
                    position: absolute;
                    top: 0;
                    width: 50%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    flex-direction: column;
                    padding: 0 10%;
                }

                /* ✅ PERFORMANCE FIX: Added GPU Acceleration & removed blur */
                .credentials-panel.signin { left: 0; }
                .credentials-panel.signin .slide-element {
                    transform: translate3d(0, 0, 0);
                    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease;
                    opacity: 1;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }

                .credentials-panel.signin .slide-element:nth-child(1) { transition-delay: 2.1s; }
                .credentials-panel.signin .slide-element:nth-child(2) { transition-delay: 2.2s; }
                .credentials-panel.signin .slide-element:nth-child(3) { transition-delay: 2.3s; }
                .credentials-panel.signin .slide-element:nth-child(4) { transition-delay: 2.4s; }
                .credentials-panel.signin .slide-element:nth-child(5) { transition-delay: 2.5s; }
                .credentials-panel.signin .slide-element:nth-child(6) { transition-delay: 2.6s; }

                .auth-wrapper.toggled .credentials-panel.signin .slide-element {
                    transform: translate3d(-120%, 0, 0);
                    opacity: 0;
                }

                .auth-wrapper.toggled .credentials-panel.signin .slide-element:nth-child(1) { transition-delay: 0s; }
                .auth-wrapper.toggled .credentials-panel.signin .slide-element:nth-child(2) { transition-delay: 0.1s; }
                .auth-wrapper.toggled .credentials-panel.signin .slide-element:nth-child(3) { transition-delay: 0.2s; }
                .auth-wrapper.toggled .credentials-panel.signin .slide-element:nth-child(4) { transition-delay: 0.3s; }
                .auth-wrapper.toggled .credentials-panel.signin .slide-element:nth-child(5) { transition-delay: 0.4s; }
                .auth-wrapper.toggled .credentials-panel.signin .slide-element:nth-child(6) { transition-delay: 0.5s; }

                .credentials-panel.signup { right: 0; }
                .credentials-panel.signup .slide-element {
                    transform: translate3d(120%, 0, 0);
                    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease;
                    opacity: 0;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }

                .credentials-panel.signup .slide-element:nth-child(1) { transition-delay: 0s; }
                .credentials-panel.signup .slide-element:nth-child(2) { transition-delay: 0.1s; }
                .credentials-panel.signup .slide-element:nth-child(3) { transition-delay: 0.2s; }
                .credentials-panel.signup .slide-element:nth-child(4) { transition-delay: 0.3s; }
                .credentials-panel.signup .slide-element:nth-child(5) { transition-delay: 0.4s; }
                .credentials-panel.signup .slide-element:nth-child(6) { transition-delay: 0.5s; }
                .credentials-panel.signup .slide-element:nth-child(7) { transition-delay: 0.6s; }

                .auth-wrapper.toggled .credentials-panel.signup .slide-element {
                    transform: translate3d(0, 0, 0);
                    opacity: 1;
                }

                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(1) { transition-delay: 1.7s; }
                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(2) { transition-delay: 1.8s; }
                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(3) { transition-delay: 1.9s; }
                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(4) { transition-delay: 1.9s; }
                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(5) { transition-delay: 2.0s; }
                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(6) { transition-delay: 2.1s; }
                .auth-wrapper.toggled .credentials-panel.signup .slide-element:nth-child(7) { transition-delay: 2.2s; }

                .credentials-panel h2 {
                    font-size: 42px;
                    text-align: center;
                    margin-bottom: 20px;
                }

                .credentials-panel .field-wrapper {
                    position: relative;
                    width: 100%;
                    height: 50px;
                    margin-top: 30px;
                }

                .field-wrapper input {
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    border: none;
                    outline: none;
                    font-size: 16px;
                    color: #fff;
                    font-weight: 600;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.3);
                    padding-right: 23px;
                    transition: border-color .3s ease;
                }

                .field-wrapper input:focus,
                .field-wrapper input:valid {
                    border-bottom: 2px solid var(--violet-glow);
                }

                .field-wrapper label {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    transform: translateY(-50%);
                    font-size: 16px;
                    color: rgba(255, 255, 255, 0.5);
                    transition: all .3s ease;
                    pointer-events: none;
                }

                .field-wrapper input:focus~label,
                .field-wrapper input:valid~label {
                    top: -5px;
                    color: var(--violet-glow);
                    font-size: 12px;
                }

                .field-wrapper i {
                    position: absolute;
                    top: 50%;
                    right: 0;
                    font-size: 18px;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.5);
                    transition: color 0.3s ease;
                }

                .field-wrapper input:focus~i,
                .field-wrapper input:valid~i {
                    color: var(--violet-glow);
                }

                .submit-button {
                    position: relative;
                    width: 100%;
                    height: 50px;
                    background: transparent;
                    border-radius: 40px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 600;
                    border: 2px solid var(--violet-glow);
                    overflow: hidden;
                    z-index: 1;
                    margin-top: 20px;
                }

                .submit-button::before {
                    content: "";
                    position: absolute;
                    height: 300%;
                    width: 100%;
                    background: linear-gradient(var(--primary-bg), var(--violet-glow), var(--primary-bg), var(--violet-glow));
                    top: -100%;
                    left: 0;
                    z-index: -1;
                    transition: top .5s ease;
                }

                .submit-button:hover:before { top: 0; }

                .switch-link {
                    font-size: 15px;
                    text-align: center;
                    margin: 30px 0 10px;
                }

                .switch-link a {
                    text-decoration: none;
                    color: var(--violet-glow);
                    font-weight: 600;
                }

                .switch-link a:hover {
                    text-decoration: underline;
                    text-shadow: 0 0 10px rgba(138, 43, 226, 0.5);
                }

                .welcome-section {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 50%;
                    display: flex;
                    justify-content: center;
                    flex-direction: column;
                    z-index: 5;
                    pointer-events: none;
                }

                .welcome-section.signin {
                    right: 0;
                    text-align: right;
                    padding-right: 10%;
                }

                .welcome-section.signin .slide-element {
                    transform: translate3d(0, 0, 0);
                    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease;
                    opacity: 1;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }

                .welcome-section.signin .slide-element:nth-child(1) { transition-delay: 2.0s; }
                .welcome-section.signin .slide-element:nth-child(2) { transition-delay: 2.1s; }
                .welcome-section.signin .slide-element:nth-child(3) { transition-delay: 2.2s; }

                .auth-wrapper.toggled .welcome-section.signin .slide-element {
                    transform: translate3d(120%, 0, 0);
                    opacity: 0;
                }

                .auth-wrapper.toggled .welcome-section.signin .slide-element:nth-child(1) { transition-delay: 0s; }
                .auth-wrapper.toggled .welcome-section.signin .slide-element:nth-child(2) { transition-delay: 0.1s; }
                .auth-wrapper.toggled .welcome-section.signin .slide-element:nth-child(3) { transition-delay: 0.2s; }

                .welcome-section.signup {
                    left: 0;
                    text-align: left;
                    padding-left: 10%;
                }

                .welcome-section.signup .slide-element {
                    transform: translate3d(-120%, 0, 0);
                    transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s ease;
                    opacity: 0;
                    will-change: transform, opacity;
                    backface-visibility: hidden;
                }

                .welcome-section.signup .slide-element:nth-child(1) { transition-delay: 0s; }
                .welcome-section.signup .slide-element:nth-child(2) { transition-delay: 0.1s; }
                .welcome-section.signup .slide-element:nth-child(3) { transition-delay: 0.2s; }

                .auth-wrapper.toggled .welcome-section.signup .slide-element {
                    transform: translate3d(0, 0, 0);
                    opacity: 1;
                }

                .auth-wrapper.toggled .welcome-section.signup .slide-element:nth-child(1) { transition-delay: 1.7s; }
                .auth-wrapper.toggled .welcome-section.signup .slide-element:nth-child(2) { transition-delay: 1.8s; }
                .auth-wrapper.toggled .welcome-section.signup .slide-element:nth-child(3) { transition-delay: 1.9s; }

                .thematic-icon {
                    position: relative;
                    margin-bottom: 30px;
                    display: inline-block;
                }

                .welcome-section.signin .thematic-icon { align-self: flex-end; }
                .welcome-section.signup .thematic-icon { align-self: flex-start; }

                .thematic-icon > i:first-child {
                    font-size: 80px;
                    color: rgba(255, 255, 255, 0.1);
                    text-shadow: 0 0 20px rgba(138, 43, 226, 0.4);
                }

                .overlay-icon {
                    position: absolute;
                    bottom: -10px;
                    right: -15px;
                    font-size: 40px;
                    color: var(--violet-glow);
                    text-shadow: 0 0 15px var(--violet-glow);
                    animation: pulse 2s infinite;
                }

                .welcome-section.signup .overlay-icon {
                    right: auto;
                    left: 55px;
                }

                @keyframes pulse {
                    0% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.1); filter: brightness(1.3); }
                    100% { transform: scale(1); filter: brightness(1); }
                }

                .welcome-section h2 {
                    text-transform: uppercase;
                    font-size: 50px;
                    line-height: 1.1;
                    margin-bottom: 10px;
                    text-shadow: 0 0 20px rgba(138, 43, 226, 0.5);
                }

                .theme-subtitle {
                    font-size: 18px;
                    color: var(--violet-accent);
                    letter-spacing: 1px;
                }

                /* ✅ PERFORMANCE FIX: Hardware acceleration for large background shapes */
                .auth-wrapper .background-shape {
                    position: absolute;
                    right: -10vw;
                    top: -10vh;
                    height: 120vh;
                    width: 70vw;
                    background: linear-gradient(45deg, var(--violet-dark), var(--violet-glow));
                    transform: rotate(15deg) skewY(20deg) translateZ(0);
                    transform-origin: bottom right;
                    transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
                    transition-delay: 1.6s;
                    box-shadow: 0 0 50px rgba(138, 43, 226, 0.4);
                    overflow: hidden;
                    will-change: transform;
                    backface-visibility: hidden;
                }

                .scanner-line {
                    position: absolute;
                    top: 0;
                    left: -20%;
                    width: 140%;
                    height: 5px;
                    background: var(--violet-accent);
                    box-shadow: 0 0 20px var(--violet-accent), 0 0 40px var(--violet-accent);
                    animation: scan 4s linear infinite alternate;
                    opacity: 0.6;
                    will-change: transform;
                }

                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(120vh); opacity: 0; }
                }

                .auth-wrapper.toggled .background-shape {
                    transform: rotate(0deg) skewY(0deg) translateZ(0);
                    transition-delay: .5s;
                }

                .auth-wrapper .secondary-shape {
                    position: absolute;
                    left: 20vw;
                    top: 100%;
                    height: 120vh;
                    width: 80vw;
                    background: var(--primary-bg);
                    border-top: 5px solid var(--violet-accent);
                    transform: rotate(0deg) skewY(0deg) translateZ(0);
                    transform-origin: bottom left;
                    transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
                    transition-delay: .5s;
                    box-shadow: 0 -20px 50px rgba(138, 43, 226, 0.3);
                    will-change: transform;
                    backface-visibility: hidden;
                }

                .auth-wrapper.toggled .secondary-shape {
                    transform: rotate(-15deg) skewY(-20deg) translateZ(0);
                    transition-delay: 1.2s;
                }
            `}</style>
        </>
    );
};

export default AuthForm;