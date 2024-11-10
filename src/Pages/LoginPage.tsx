import '../Styles/LoginPage.css'
import React, { useState } from "react";

interface LoginPageProps {
    onLogin: () => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showErr, setShowErr] = useState<boolean>(false)

    const log: string = 'admin'
    const pass: string = 'admin'

    const handleLogin = () => {
        if (username === log && password === pass) {
            onLogin()
        } else {
            setShowErr(true)
        }
    }
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === "Enter") {
            handleLogin();
        }
    };

    return (
        <div className='login-page'>
            <div className="login-area">
                <input
                    type="text"
                    className="login-input"
                    placeholder="Login"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <input
                    type="password"
                    className="pass-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={handleLogin}
                    className="login-btn"
                >Войти</button>
                {
                    showErr && <div className="err-msg">Неправильный логин или пароль</div>
                }
            </div>
        </div>

    );
};

export default LoginPage;