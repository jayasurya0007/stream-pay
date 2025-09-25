import { useEffect, useState } from 'react';
import { generateSessionKey, getStoredSessionKey, storeSessionKey, type SessionKey } from '../lib/utils';

export const useSessionKey = () => {
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);

    useEffect(() => {
        const existing = getStoredSessionKey();
        if (existing) {
            setSessionKey(existing);
        } else {
            const fresh = generateSessionKey();
            storeSessionKey(fresh);
            setSessionKey(fresh);
        }
    }, []);

    return { sessionKey };
};


