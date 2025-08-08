import React, { useState } from 'react';
import SignUp from './SignUp';
import SignIn from './SignIn';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(true);

    const switchToSignIn = () => setIsSignUp(false);
    const switchToSignUp = () => setIsSignUp(true);

    return (
        <div>
            {isSignUp ? (
                <SignUp onSwitchToSignIn={switchToSignIn} />
            ) : (
                <SignIn onSwitchToSignUp={switchToSignUp} />
            )}
        </div>
    );
};

export default Auth;
