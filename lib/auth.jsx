import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { clearToken, getToken, request, saveToken } from './api';

const AuthContext = createContext(null);

// Email + password sign-in against the backend's /api/auth endpoints.
export function AuthProvider({ children }) {
    const [status, setStatus] = useState('loading'); // 'loading' | 'signedOut' | 'signedIn'
    const [user, setUser] = useState(null);

    const signOutLocally = useCallback(async () => {
        await clearToken();
        setUser(null);
        setStatus('signedOut');
    }, []);

    const loadUser = useCallback(async () => {
        const data = await request('get', '/api/auth/me');
        setUser(data.user);
        setStatus('signedIn');
    }, []);

    // Restore the saved session on launch.
    useEffect(() => {
        (async () => {
            if (!(await getToken())) return setStatus('signedOut');
            try {
                await loadUser();
            } catch (err) {
                // Only drop the session if the server rejected it, not when it's just unreachable.
                if (err.status === 401 || err.status === 403 || err.status === 404) await signOutLocally();
                else setStatus('signedIn');
            }
        })();
    }, [loadUser, signOutLocally]);

    const signIn = useCallback(async (email, password) => {
        const { token } = await request('post', '/api/auth/login', { email: email.trim(), password });
        await saveToken(token);
        await loadUser();
    }, [loadUser]);

    // /api/auth/register doesn't return a token, so sign in with the new account right after.
    const signUp = useCallback(async (name, email, password) => {
        await request('post', '/api/auth/register', { name: name.trim(), email: email.trim(), password });
        await signIn(email, password);
    }, [signIn]);

    const signOut = useCallback(async () => {
        await request('post', '/api/auth/logout').catch(() => {});
        await signOutLocally();
    }, [signOutLocally]);

    // Not signed in (or the session expired): send them back to the login screen.
    const handleAuthError = useCallback((err) => {
        if (err.status === 401 || err.status === 403) {
            signOutLocally();
            return true;
        }
        return false;
    }, [signOutLocally]);

    const value = useMemo(
        () => ({ status, user, signIn, signUp, signOut, refreshUser: loadUser, handleAuthError }),
        [status, user, signIn, signUp, signOut, loadUser, handleAuthError],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
