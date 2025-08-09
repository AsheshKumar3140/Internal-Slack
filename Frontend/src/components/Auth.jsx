import React, { useState } from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';

const Auth = ({ onAuthSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(true);

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
