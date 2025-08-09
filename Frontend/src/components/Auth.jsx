import React, { useState, useEffect } from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';

const Auth = ({ onAuthSuccess, defaultMode = 'signup' }) => {
    const [isSignUp, setIsSignUp] = useState(defaultMode !== 'signin');

    useEffect(() => {
        setIsSignUp(defaultMode !== 'signin');
    }, [defaultMode]);

    const switchToSignIn = () => setIsSignUp(false);
    const switchToSignUp = () => setIsSignUp(true);

    return (
        <div>
            {isSignUp ? (
                <SignUp onSwitchToSignIn={switchToSignIn} onAuthSuccess={onAuthSuccess} />
            ) : (
                <SignIn onSwitchToSignUp={switchToSignUp} onAuthSuccess={onAuthSuccess} />
            )}
        </div>
    );
};

export default Auth;
