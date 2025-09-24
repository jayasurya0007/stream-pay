import { useState, useEffect } from 'preact/hooks';
import { createWalletClient, custom, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
// CHAPTER 3: Authentication imports
// CHAPTER 4: Add balance fetching imports
import {
    createAuthRequestMessage,
    createAuthVerifyMessage,
    createEIP712AuthMessageSigner,
    parseAnyRPCResponse,
    RPCMethod,
    type AuthChallengeResponse,
    type AuthRequestParams,
    createECDSAMessageSigner,
    createGetLedgerBalancesMessage,
    type GetLedgerBalancesResponse,
    type BalanceUpdateResponse,
    type TransferResponse,
    // App session APIs
    createAppSessionMessage,
    parseCreateAppSessionResponse,
    createCloseAppSessionMessage,
    parseCloseAppSessionResponse,
    NitroliteRPC,
    parseGetAppSessionsResponse,
    type RPCAppDefinition,
    type RPCAppSessionAllocation,
    // App state APIs
    createSubmitAppStateMessage,
    parseSubmitAppStateResponse,
} from '@erc7824/nitrolite';
// CHAPTER 4: Import the new BalanceDisplay component
import { BalanceDisplay } from './components/BalanceDisplay/BalanceDisplay';
// FINAL: Import useTransfer hook
import { useTransfer } from './hooks/useTransfer';
import { webSocketService, type WsStatus } from './lib/websocket';
// CHAPTER 3: Authentication utilities
import {
    generateSessionKey,
    getStoredSessionKey,
    storeSessionKey,
    removeSessionKey,
    storeJWT,
    removeJWT,
    type SessionKey,
} from './lib/utils';

function safeStringify(value: unknown) {
    return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
}

declare global {
    interface Window {
        ethereum?: any;
    }
}

// CHAPTER 3: EIP-712 domain for Nexus authentication
const getAuthDomain = () => ({
    name: 'Nexus',
});

// CHAPTER 3: Authentication constants
const AUTH_SCOPE = 'nexus.app';
const APP_NAME = 'Nexus';
const SESSION_DURATION = 3600; // 1 hour

// Defaults for app sessions
const DEFAULT_PROTOCOL = 'nitroliterpc';
const DEFAULT_WEIGHTS = [100, 0];
const DEFAULT_QUORUM = 100;

export function App() {
    const [account, setAccount] = useState<Address | null>(null);
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
    const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');
    // CHAPTER 3: Authentication state
    const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthAttempted, setIsAuthAttempted] = useState(false);
    const [sessionExpireTimestamp, setSessionExpireTimestamp] = useState<string>('');
    // CHAPTER 4: Add balance state to store fetched balances
    const [balances, setBalances] = useState<Record<string, string> | null>(null);
    // CHAPTER 4: Add loading state for better user experience
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);
    
    // FINAL: Add transfer state
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferStatus, setTransferStatus] = useState<string | null>(null);

    // App Session UI state
    const [participantB, setParticipantB] = useState<string>('');
    const [amount, setAmount] = useState<string>('0.01');
    const [createResult, setCreateResult] = useState<string>('');
    const [getSessionsResult, setGetSessionsResult] = useState<string>('');
    const [closeSessionId, setCloseSessionId] = useState<string>('');
    const [closeResult, setCloseResult] = useState<string>('');

    // App State UI state
    const [appStateValue, setAppStateValue] = useState<string>('{"counter":1}');
    const [submitStateResult, setSubmitStateResult] = useState<string>('');
    const [getStateResult, setGetStateResult] = useState<string>('');

    // Channels / RPC history UI state
    const [channelsResult, setChannelsResult] = useState<string>('');
    const [rpcHistoryResult, setRpcHistoryResult] = useState<string>('');
    const [deriveStateFromHistory, setDeriveStateFromHistory] = useState<boolean>(false);

    // FINAL: Use transfer hook
    const { handleTransfer: transferFn } = useTransfer(sessionKey, isAuthenticated);

    useEffect(() => {
        // CHAPTER 3: Get or generate session key on startup (IMPORTANT: Store in localStorage)
        const existingSessionKey = getStoredSessionKey();
        if (existingSessionKey) {
            setSessionKey(existingSessionKey);
        } else {
            const newSessionKey = generateSessionKey();
            storeSessionKey(newSessionKey);
            setSessionKey(newSessionKey);
        }

        webSocketService.addStatusListener(setWsStatus);
        webSocketService.connect();

        return () => {
            webSocketService.removeStatusListener(setWsStatus);
        };
    }, []);

    // CHAPTER 3: Auto-trigger authentication when conditions are met
    useEffect(() => {
        if (account && sessionKey && wsStatus === 'Connected' && !isAuthenticated && !isAuthAttempted) {
            setIsAuthAttempted(true);

            // Generate fresh timestamp for this auth attempt
            const expireTimestamp = String(Math.floor(Date.now() / 1000) + SESSION_DURATION);
            setSessionExpireTimestamp(expireTimestamp);

            const authParams: AuthRequestParams = {
                address: account,
                session_key: sessionKey.address,
                app_name: APP_NAME,
                expire: expireTimestamp,
                scope: AUTH_SCOPE,
                application: account,
                allowances: [],
            };

            createAuthRequestMessage(authParams).then((payload) => {
                webSocketService.send(payload);
            });
        }
    }, [account, sessionKey, wsStatus, isAuthenticated, isAuthAttempted]);

    // CHAPTER 4: Automatically fetch balances when user is authenticated
    // This useEffect hook runs whenever authentication status, sessionKey, or account changes
    useEffect(() => {
        // Only proceed if all required conditions are met:
        // 1. User has completed authentication
        // 2. We have a session key (temporary private key for signing)
        // 3. We have the user's wallet address
        if (isAuthenticated && sessionKey && account) {
            console.log('Authenticated! Fetching ledger balances...');

            // CHAPTER 4: Show loading state while we fetch balances
            setIsLoadingBalances(true);

            // CHAPTER 4: Create a "signer" - this is what signs our requests without user popups
            // Think of this like a temporary stamp that proves we're allowed to make requests
            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);

            // CHAPTER 4: Create a signed request to get the user's asset balances
            // This is like asking "What's in my wallet?" but with cryptographic proof
            createGetLedgerBalancesMessage(sessionSigner, account)
                .then((getBalancesPayload) => {
                    // Send the signed request through our WebSocket connection
                    console.log('Sending balance request...');
                    webSocketService.send(getBalancesPayload);
                })
                .catch((error) => {
                    console.error('Failed to create balance request:', error);
                    setIsLoadingBalances(false); // Stop loading on error
                    // In a real app, you might show a user-friendly error message here
                });
        }
    }, [isAuthenticated, sessionKey, account]);

    // FINAL: Handle support function (kept for potential future use)
    const handleSupport = async (recipient: string, amount: string) => {
        setIsTransferring(true);
        setTransferStatus('Sending support...');
        
        const result = await transferFn(recipient as Address, amount);
        
        if (result.success) {
            setTransferStatus('Support sent!');
        } else {
            setIsTransferring(false);
            setTransferStatus(null);
            if (result.error) {
                alert(result.error);
            }
        }
    };

    // Create App Session
    const handleCreateAppSession = async () => {
        if (!isAuthenticated || !sessionKey || !account) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setCreateResult('Creating session...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const appDefinition: RPCAppDefinition = {
                protocol: DEFAULT_PROTOCOL,
                participants: [account, participantB] as unknown as `0x${string}`[],
                weights: DEFAULT_WEIGHTS,
                quorum: DEFAULT_QUORUM,
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
    };

    // Get App Sessions
    const handleGetSessions = async () => {
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
    };

    // Close App Session
    const handleCloseSession = async () => {
        if (!isAuthenticated || !sessionKey) {
            alert('Connect and authenticate first');
            return;
        }
        try {
            setCloseResult('Closing session...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            if (!closeSessionId) {
                throw new Error('App session ID required');
            }
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
    };

    // Submit App State
    const handleSubmitAppState = async () => {
        if (!isAuthenticated || !sessionKey || !closeSessionId) {
            alert('Authenticate and provide App Session ID');
            return;
        }
        try {
            setSubmitStateResult('Submitting app state...');
            const signer = createECDSAMessageSigner(sessionKey.privateKey);
            const payloadString = appStateValue;
            const signed = await createSubmitAppStateMessage(signer, {
                app_session_id: closeSessionId as unknown as `0x${string}`,
                session_data: payloadString,
            } as any);
            webSocketService.send(signed);
        } catch (e) {
            setSubmitStateResult(`Error: ${(e as Error).message}`);
        }
    };

    // Get Channels
    const handleGetChannels = async () => {
        if (!isAuthenticated || !sessionKey || !account) {
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
    };

    // Get RPC History
    const handleGetRPCHistory = async () => {
        if (!isAuthenticated || !sessionKey || !account) {
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
    };

    // CHAPTER 3: Handle server messages for authentication
    useEffect(() => {
        const handleMessage = async (data: any) => {
            const response = parseAnyRPCResponse(JSON.stringify(data));

            // Handle auth challenge
            if (
                response.method === RPCMethod.AuthChallenge &&
                walletClient &&
                sessionKey &&
                account &&
                sessionExpireTimestamp
            ) {
                const challengeResponse = response as AuthChallengeResponse;

                const authParams = {
                    scope: AUTH_SCOPE,
                    application: walletClient.account?.address as `0x${string}`,
                    participant: sessionKey.address as `0x${string}`,
                    expire: sessionExpireTimestamp,
                    allowances: [],
                };

                const eip712Signer = createEIP712AuthMessageSigner(walletClient, authParams, getAuthDomain());

                try {
                    const authVerifyPayload = await createAuthVerifyMessage(eip712Signer, challengeResponse);
                    webSocketService.send(authVerifyPayload);
                } catch (error) {
                    alert('Signature rejected. Please try again.');
                    setIsAuthAttempted(false);
                }
            }

            // Handle auth success
            if (response.method === RPCMethod.AuthVerify && response.params?.success) {
                setIsAuthenticated(true);
                if (response.params.jwtToken) storeJWT(response.params.jwtToken);
            }

            // CHAPTER 4: Handle balance responses (when we asked for balances)
            if (response.method === RPCMethod.GetLedgerBalances) {
                const balanceResponse = response as GetLedgerBalancesResponse;
                const balances = balanceResponse.params.ledgerBalances;

                console.log('Received balance response:', balances);

                // Check if we actually got balance data back
                if (balances && balances.length > 0) {
                    // CHAPTER 4: Transform the data for easier use in our UI
                    // Convert from: [{asset: "usdc", amount: "100"}, {asset: "eth", amount: "0.5"}]
                    // To: {"usdc": "100", "eth": "0.5"}
                    const balancesMap = Object.fromEntries(
                        balances.map((balance) => [balance.asset, balance.amount]),
                    );
                    console.log('Setting balances:', balancesMap);
                    setBalances(balancesMap);
                } else {
                    console.log('No balance data received - wallet appears empty');
                    setBalances({});
                }
                // CHAPTER 4: Stop loading once we receive any balance response
                setIsLoadingBalances(false);
            }

            // CHAPTER 4: Handle live balance updates (server pushes these automatically)
            if (response.method === RPCMethod.BalanceUpdate) {
                const balanceUpdate = response as BalanceUpdateResponse;
                const balances = balanceUpdate.params.balanceUpdates;

                console.log('Live balance update received:', balances);

                // Same data transformation as above
                const balancesMap = Object.fromEntries(
                    balances.map((balance) => [balance.asset, balance.amount]),
                );
                console.log('Updating balances in real-time:', balancesMap);
                setBalances(balancesMap);
            }

            // FINAL: Handle transfer response
            if (response.method === RPCMethod.Transfer) {
                const transferResponse = response as TransferResponse;
                console.log('Transfer completed:', transferResponse.params);
                
                setIsTransferring(false);
                setTransferStatus(null);
                
                alert(`Transfer completed successfully!`);
            }

            // Handle errors
            if (response.method === RPCMethod.Error) {
                console.error('RPC Error:', response.params);
                
                if (isTransferring) {
                    setIsTransferring(false);
                    setTransferStatus(null);
                    alert(`Transfer failed: ${response.params.error}`);
                } else {
                    // Other errors (like auth failures)
                    removeJWT();
                    removeSessionKey();
                    alert(`Error: ${response.params.error}`);
                    setIsAuthAttempted(false);
                }
            }

            // Handle App Session related responses
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

            // App State responses
            try {
                const submitted = parseSubmitAppStateResponse(JSON.stringify(data));
                if (submitted?.params?.appSessionId) {
                    setSubmitStateResult(`Submitted state for: ${submitted.params.appSessionId}`);
                }
            } catch {}
            const anyResp = response as any;
            if (anyResp?.method === 'GetAppState' && anyResp?.params?.state) {
                setGetStateResult(safeStringify(anyResp.params.state));
            }

            // Channels / RPC history responses
            const methodName = (anyResp?.method || '').toLowerCase();
            if ((methodName === 'getchannels' || methodName === 'get_channels') && anyResp?.params) {
                setChannelsResult(safeStringify(anyResp.params));
            }
            if ((methodName === 'getrpchistory' || methodName === 'get_rpc_history') && anyResp?.params) {
                setRpcHistoryResult(safeStringify(anyResp.params));
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
                            setGetStateResult(typeof stateVal === 'string' ? stateVal : safeStringify(stateVal));
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
    }, [walletClient, sessionKey, sessionExpireTimestamp, account, isTransferring]);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert('MetaMask not found! Please install MetaMask from https://metamask.io/');
            return;
        }

        try {
            // Check current network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x1') { // Not mainnet
                alert('Please switch to Ethereum Mainnet in MetaMask for this workshop');
                // Note: In production, you might want to automatically switch networks
            }

            const tempClient = createWalletClient({
                chain: mainnet,
                transport: custom(window.ethereum),
            });
            const [address] = await tempClient.requestAddresses();

            if (!address) {
                alert('No wallet address found. Please ensure MetaMask is unlocked.');
                return;
            }

            // CHAPTER 3: Create wallet client with account for EIP-712 signing
            const walletClient = createWalletClient({
                account: address,
                chain: mainnet,
                transport: custom(window.ethereum),
            });

            setWalletClient(walletClient);
            setAccount(address);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Failed to connect wallet. Please try again.');
            return;
        }
    };

    const formatAddress = (address: Address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div className="app-container">
            <header className="header">
                <div className="header-content">
                    <h1 className="logo">Nexus</h1>
                    <p className="tagline">Decentralized insights for the next generation of builders</p>
                </div>
                <div className="header-controls">
                    {/* CHAPTER 4: Display balance when authenticated */}
                    {isAuthenticated && (
                        <BalanceDisplay
                            balance={
                                isLoadingBalances ? 'Loading...' : (balances?.['usdc'] ?? null)
                            }
                            symbol="USDC"
                        />
                    )}
                    <div className={`ws-status ${wsStatus.toLowerCase()}`}>
                        <span className="status-dot"></span> {wsStatus}
                    </div>
                    <div className="wallet-connector">
                        {account ? (
                            <div className="wallet-info">Connected: {formatAddress(account)}</div>
                        ) : (
                            <button onClick={connectWallet} className="connect-button">
                                Connect Wallet
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="main-content">
                
                {/* FINAL: Status message for transfers */}
                {transferStatus && (
                    <div className="transfer-status">
                        {transferStatus}
                    </div>
                )}
                
                {/* App Session Controls */}
                <section style={{ marginTop: 24 }}>
                    <h3>Application Sessions</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Participant B (0x...)"
                            value={participantB}
                            onInput={(e: any) => setParticipantB(e.currentTarget.value)}
                            style={{ padding: '8px 12px' }}
                        />
                        <input
                            type="text"
                            placeholder="Amount (USDC)"
                            value={amount}
                            onInput={(e: any) => setAmount(e.currentTarget.value)}
                            style={{ padding: '8px 12px', width: 120 }}
                        />
                        <button onClick={handleCreateAppSession} disabled={!isAuthenticated}>
                            Create App Session
                        </button>
                        <button onClick={handleGetSessions} disabled={!isAuthenticated}>
                            Get App Sessions
                        </button>
                        <input
                            type="text"
                            placeholder="App Session ID"
                            value={closeSessionId}
                            onInput={(e: any) => setCloseSessionId(e.currentTarget.value)}
                            style={{ padding: '8px 12px', width: 320 }}
                        />
                        <button onClick={handleCloseSession} disabled={!isAuthenticated}>
                            Close App Session
                        </button>
                    </div>
                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {createResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{createResult}</pre>}
                        {getSessionsResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{getSessionsResult}</pre>}
                        {closeResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{closeResult}</pre>}
                    </div>
                </section>

                {/* App State Controls */}
                <section style={{ marginTop: 24 }}>
                    <h3>Application State</h3>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="State JSON or text"
                            value={appStateValue}
                            onInput={(e: any) => setAppStateValue(e.currentTarget.value)}
                            style={{ padding: '8px 12px', width: 360 }}
                        />
                        <button onClick={handleSubmitAppState} disabled={!isAuthenticated || !closeSessionId}>
                            Submit App State
                        </button>
                        <button onClick={handleGetChannels} disabled={!isAuthenticated}>
                            Get Channels
                        </button>
                        <button onClick={handleGetRPCHistory} disabled={!isAuthenticated}>
                            Get RPC History
                        </button>
                    </div>
                    <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                        {submitStateResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{submitStateResult}</pre>}
                        {getStateResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{getStateResult}</pre>}
                        {channelsResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{channelsResult}</pre>}
                        {rpcHistoryResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{rpcHistoryResult}</pre>}
                    </div>
                </section>
                
                {/* Removed PostList and mock data */}
            </main>
        </div>
    );
}
