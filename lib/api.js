import { requireOptionalNativeModule } from 'expo';
import { File, Paths } from 'expo-file-system';

import { API_URL } from '../config';

export const SERVER = API_URL.replace(/\/+$/, '');
const TOKEN_KEY = 'token';

// The login token lives in the Keychain/Keystore (expo-secure-store). Builds made before
// expo-secure-store was added don't have its native code, so they fall back to a file in the app's
// private storage until the next `eas build`.
const SecureStore = requireOptionalNativeModule('ExpoSecureStore') ? require('expo-secure-store') : null;
const tokenFile = new File(Paths.document, 'session-token.txt');

// The token is also kept in memory, so a storage failure only means signing in again after a restart.
let cachedToken;

export async function getToken() {
    if (cachedToken !== undefined) return cachedToken;
    try {
        if (SecureStore) cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        else cachedToken = tokenFile.exists ? tokenFile.textSync() || null : null;
    } catch {
        cachedToken = null;
    }
    return cachedToken;
}

export async function saveToken(token) {
    cachedToken = token;
    try {
        if (SecureStore) await SecureStore.setItemAsync(TOKEN_KEY, token);
        else {
            if (!tokenFile.exists) tokenFile.create({ intermediates: true });
            tokenFile.writeSync(token);
        }
    } catch {
        // Still signed in for this session; they'll just sign in again after a restart.
    }
}

export async function clearToken() {
    cachedToken = null;
    try {
        if (SecureStore) await SecureStore.deleteItemAsync(TOKEN_KEY);
        else if (tokenFile.exists) tokenFile.delete();
    } catch {
        // Nothing saved to clear.
    }
}

// Shared fetch call: attaches the login token and unwraps the server's error message.
export async function request(method, path, data) {
    const token = await getToken();
    let response;
    try {
        response = await fetch(`${SERVER}${path}`, {
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: data === undefined ? undefined : JSON.stringify(data),
        });
    } catch {
        const offline = new Error(`Can't reach the server at ${SERVER}. Check your connection and try again.`);
        offline.status = 0;
        throw offline;
    }

    // A non-JSON reply (e.g. an HTML error page) falls back to the generic message below.
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const wrapped = new Error(body.message || body.msg || 'Something went wrong. Please try again.');
        wrapped.status = response.status;
        throw wrapped;
    }
    return body;
}

// TeleQueue endpoints (habackend/telegram/routes/telegram.routes.js).
export const telegram = (method, path, data) => request(method, `/api/telegram${path}`, data);
