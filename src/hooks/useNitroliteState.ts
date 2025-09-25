import { useCallback, useEffect, useState } from 'react';
import {
    createECDSAMessageSigner,
    createSubmitAppStateMessage,
    parseSubmitAppStateResponse,
    parseAnyRPCResponse,
    NitroliteRPC,
} from '@erc7824/nitrolite';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';

export const useNitroliteState = (isAuthenticated: boolean, sessionKey: SessionKey | null) => {
    const [appStateValue, setAppStateValue] = useState<string>('{"counter":1}');
    const [submitStateResult, setSubmitStateResult] = useState<string>('');
    const [getStateResult, setGetStateResult] = useState<string>('');
    const [channelsResult, setChannelsResult] = useState<string>('');
    const [rpcHistoryResult, setRpcHistoryResult] = useState<string>('');
    const [deriveStateFromHistory, setDeriveStateFromHistory] = useState<boolean>(false);

    const handleSubmitAppState = useCallback(async (appSessionId: string | null) => {
        if (!isAuthenticated || !sessionKey || !appSessionId) {
            alert('Authenticate and provide App Session ID');
            return;
        }
        try {
            setSubmitStateResult('Submitting app state...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const payloadString = appStateValue;
            const signed = await createSubmitAppStateMessage(signer, {
                app_session_id: appSessionId as unknown as `0x${string}`,
                session_data: payloadString,
            } as any);
            webSocketService.send(signed);
        } catch (e) {
            setSubmitStateResult(`Error: ${(e as Error).message}`);
        }
    }, [isAuthenticated, sessionKey, appStateValue]);

    const handleGetChannels = useCallback(async () => {
        if (!isAuthenticated || !sessionKey) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setChannelsResult('Loading channels...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const timestamp = Date.now();
            const requestId = Math.floor(Math.random() * 1000000);
            const request = NitroliteRPC.createRequest({
                requestId,
                method: 'get_channels' as any,
                params: {},
                timestamp,
            } as any);
            const signed = await NitroliteRPC.signRequestMessage(request as any, signer as any);
            webSocketService.send(JSON.stringify(signed));
        } catch (e) {
            setChannelsResult(`Error: ${(e as Error).message}`);
        }
    }, [isAuthenticated, sessionKey]);

    const handleGetRPCHistory = useCallback(async () => {
        if (!isAuthenticated || !sessionKey) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setRpcHistoryResult('Loading RPC history...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const timestamp = Date.now();
            const requestId = Math.floor(Math.random() * 1000000);
            const request = NitroliteRPC.createRequest({
                requestId,
                method: 'get_rpc_history' as any,
                params: {},
                timestamp,
            } as any);
            const signed = await NitroliteRPC.signRequestMessage(request as any, signer as any);
            webSocketService.send(JSON.stringify(signed));
        } catch (e) {
            setRpcHistoryResult(`Error: ${(e as Error).message}`);
        }
    }, [isAuthenticated, sessionKey]);

    useEffect(() => {
        const handleMessage = (data: any) => {
            try {
                const submitted = parseSubmitAppStateResponse(JSON.stringify(data));
                if (submitted?.params?.appSessionId) {
                    setSubmitStateResult(`Submitted state for: ${submitted.params.appSessionId}`);
                }
            } catch {}

            const anyResp = parseAnyRPCResponse(JSON.stringify(data)) as any;
            const methodName = (anyResp?.method || '').toLowerCase();
            if ((methodName === 'getchannels' || methodName === 'get_channels') && anyResp?.params) {
                setChannelsResult(JSON.stringify(anyResp.params, null, 2));
            }
            if ((methodName === 'getrpchistory' || methodName === 'get_rpc_history') && anyResp?.params) {
                setRpcHistoryResult(JSON.stringify(anyResp.params, null, 2));
                if (deriveStateFromHistory) {
                    try {
                        const entries: any[] = anyResp.params.history ?? anyResp.params.entries ?? anyResp.params;
                        const lastWithState = Array.isArray(entries)
                            ? [...entries].reverse().find((e) => {
                                  const raw = e?.params ?? e?.request?.params ?? e;
                                  let p = raw;
                                  if (typeof raw === 'string') {
                                      try { p = JSON.parse(raw); } catch {}
                                  }
                                  return p && (p.state !== undefined || p.session_data !== undefined);
                              })
                            : undefined;
                        if (lastWithState) {
                            let p = lastWithState.params ?? lastWithState.request?.params ?? lastWithState;
                            if (typeof p === 'string') {
                                try { p = JSON.parse(p); } catch {}
                            }
                            const stateVal = p.state ?? p.session_data;
                            setGetStateResult(typeof stateVal === 'string' ? stateVal : JSON.stringify(stateVal, null, 2));
                        } else {
                            setGetStateResult('No state found in RPC history');
                        }
                    } catch (err) {
                        setGetStateResult('Failed to derive state from RPC history');
                    } finally {
                        setDeriveStateFromHistory(false);
                    }
                }
            }
        };
        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, [deriveStateFromHistory]);

    return {
        appStateValue,
        setAppStateValue,
        submitStateResult,
        getStateResult,
        channelsResult,
        rpcHistoryResult,
        deriveStateFromHistory,
        setDeriveStateFromHistory,
        handleSubmitAppState,
        handleGetChannels,
        handleGetRPCHistory,
    };
};


