import { useCallback, useEffect, useState } from 'react';
import {
    createECDSAMessageSigner,
    createAppSessionMessage,
    createCloseAppSessionMessage,
    parseCreateAppSessionResponse,
    parseCloseAppSessionResponse,
    parseGetAppSessionsResponse,
    NitroliteRPC,
    RPCMethod,
    type RPCAppDefinition,
    type RPCAppSessionAllocation,
} from '@erc7824/nitrolite';
import type { Address } from 'viem';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';

export const useNitroliteAppSessions = (
    isAuthenticated: boolean,
    sessionKey: SessionKey | null,
    account: Address | null,
) => {
    const [participantB, setParticipantB] = useState<string>('');
    const [amount, setAmount] = useState<string>('0.01');
    const [createResult, setCreateResult] = useState<string>('');
    const [getSessionsResult, setGetSessionsResult] = useState<string>('');
    const [closeSessionId, setCloseSessionId] = useState<string>('');
    const [closeResult, setCloseResult] = useState<string>('');

    const handleCreateAppSession = useCallback(async () => {
        if (!isAuthenticated || !sessionKey || !account) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setCreateResult('Creating session...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const appDefinition: RPCAppDefinition = {
                protocol: 'nitroliterpc',
                participants: [account, participantB] as unknown as `0x${string}`[],
                weights: [100, 0],
                quorum: 100,
                challenge: 0,
                nonce: Date.now(),
            };
            const allocations: RPCAppSessionAllocation[] = [
                { participant: account as unknown as `0x${string}`, asset: 'usdc', amount },
                { participant: participantB as unknown as `0x${string}`, asset: 'usdc', amount: '0' },
            ];
            const signedMessage = await createAppSessionMessage(signer, {
                definition: appDefinition,
                allocations,
            });
            webSocketService.send(signedMessage);
        } catch (e) {
            setCreateResult(`Error: ${(e as Error).message}`);
        }
    }, [isAuthenticated, sessionKey, account, participantB, amount]);

    const handleGetSessions = useCallback(async () => {
        if (!isAuthenticated || !sessionKey || !account) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setGetSessionsResult('Loading sessions...');
            const timestamp = Date.now();
            const requestId = Math.floor(Math.random() * 1000000);
            const request = NitroliteRPC.createRequest({
                requestId,
                method: RPCMethod.GetAppSessions,
                params: { participant: account },
                timestamp,
            });
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const signedRequest = await NitroliteRPC.signRequestMessage(request, signer);
            webSocketService.send(JSON.stringify(signedRequest));
        } catch (e) {
            setGetSessionsResult(`Error: ${(e as Error).message}`);
        }
    }, [isAuthenticated, sessionKey, account]);

    const handleCloseSession = useCallback(async () => {
        if (!isAuthenticated || !sessionKey) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setCloseResult('Closing session...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            if (!closeSessionId) throw new Error('App session ID required');
            const finalAllocations: RPCAppSessionAllocation[] = [
                { participant: (account as unknown as `0x${string}`) ?? '0x0', asset: 'usdc', amount: '0' },
            ];
            const signedMessage = await createCloseAppSessionMessage(signer, {
                app_session_id: closeSessionId as unknown as `0x${string}`,
                allocations: finalAllocations,
            });
            webSocketService.send(signedMessage);
        } catch (e) {
            setCloseResult(`Error: ${(e as Error).message}`);
        }
    }, [isAuthenticated, sessionKey, account, closeSessionId]);

    useEffect(() => {
        const handleMessage = (data: any) => {
            try {
                const created = parseCreateAppSessionResponse(JSON.stringify(data));
                if (created?.params?.appSessionId) {
                    setCreateResult(`Created app session: ${created.params.appSessionId}`);
                    setCloseSessionId(created.params.appSessionId);
                    localStorage.setItem('app_session_id', created.params.appSessionId);
                }
            } catch {}

            try {
                const closed = parseCloseAppSessionResponse(JSON.stringify(data));
                if (closed?.params?.appSessionId) {
                    setCloseResult(`Closed app session: ${closed.params.appSessionId}`);
                    localStorage.removeItem('app_session_id');
                }
            } catch {}

            try {
                const sessions = parseGetAppSessionsResponse(JSON.stringify(data));
                if (sessions?.params?.appSessions) {
                    setGetSessionsResult(JSON.stringify(sessions.params.appSessions, null, 2));
                }
            } catch {}
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, []);

    return {
        participantB,
        setParticipantB,
        amount,
        setAmount,
        createResult,
        getSessionsResult,
        closeSessionId,
        setCloseSessionId,
        closeResult,
        handleCreateAppSession,
        handleGetSessions,
        handleCloseSession,
    };
};


