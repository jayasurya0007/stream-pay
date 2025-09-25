import { useEffect, useState } from 'react';
import {
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createEIP712AuthMessageSigner,
    parseAnyRPCResponse,
    RPCMethod,
    type AuthChallengeResponse,
} from '@erc7824/nitrolite';
import type { Address, WalletClient } from 'viem';
import { webSocketService } from '../lib/websocket';
import { storeJWT } from '../lib/utils';

const AUTH_SCOPE = 'nexus.app';
const APP_NAME = 'Nexus';
const SESSION_DURATION = 3600;

const getAuthDomain = () => ({ name: 'Nexus' });

export const useAuth = (
    account: Address | null,
    walletClient: WalletClient | null,
    sessionKeyAddress: Address | null,
    wsStatus: 'Connecting' | 'Connected' | 'Disconnected',
) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthAttempted, setIsAuthAttempted] = useState(false);
    const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('');

    // Kick off auth when ready
    useEffect(() => {
        if (account && sessionKeyAddress && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
            setIsAuthAttempted(true);
            const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION);
            setSessionExpireTimestamp(expireTimestamp);
            const authParams = {
                address: account,
                session_key: sessionKeyAddress,
                app_name: APP_NAME,
                expire: expireTimestamp,
                scope: AUTH_SCOPE,
                application: account,
                allowances: [],
            };
            createAuthRequestMessage(authParams).then((payload) => webSocketService.send(payload));
        }
    }, [account, sessionKeyAddress, wsStatus, isAuthenticated, isAuthAttempted]);

    // Listen for auth responses
    useEffect(() => {
        const handleMessage = async (data: any) => {
            const response = parseAnyRPCResponse(JSON.stringify(data));

            if (
                response.method === RPCMethod.AuthChallenge &&
                walletClient &&
                account &&
                sessionKeyAddress &&
                sessionExpireTimestamp
            ) {
                const challengeResponse = response as AuthChallengeResponse;
                const authParams = {
                    scope: AUTH_SCOPE,
                    application: walletClient.account?.address as `0x${string}`,
                    participant: sessionKeyAddress as `0x${string}`,
                    expire: sessionExpireTimestamp,
                    allowances: [],
                };
                const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain());
                try {
                    const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse);
                    webSocketService.send(authVerifyPayload);
                } catch (e) {
                    alert('Signature rejected. Please try again.');
                    setIsAuthAttempted(false);
                }
            }

            if (response.method === RPCMethod.AuthVerify && response.params?.success) {
                setIsAuthenticated(true);
                if (response.params.jwtToken) storeJWT(response.params.jwtToken);
            }
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, [walletClient, account, sessionKeyAddress, sessionExpireTimestamp]);

    return { isAuthenticated, isAuthAttempted };
};


