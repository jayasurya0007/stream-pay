    import { useState, useEffect } from 'preact/hooks';
    import type { Address } from 'viem';
    import { parseAnyRPCResponse, RPCMethod, type TransferResponse } from '@erc7824/nitrolite';
    import { BalanceDisplay } from './components/BalanceDisplay/BalanceDisplay';
    import { useTransfer } from './hooks/useTransfer';
    import { webSocketService } from './lib/websocket';
    import { useWallet } from './hooks/useWallet';
    import { useSessionKey } from './hooks/useSessionKey';
    import { useWebSocketStatus } from './hooks/useWebSocketStatus';
    import { useAuth } from './hooks/useAuth';
    import { useBalances } from './hooks/useBalances';
    import { useNitroliteAppSessions } from './hooks/useNitroliteAppSessions';
    import { useNitroliteState } from './hooks/useNitroliteState';

    declare global {
        interface Window {
            ethereum?: any;
        }
    }

    export function App() {
        const { account, walletClient, connectWallet } = useWallet();
        const { sessionKey } = useSessionKey();
        const { wsStatus } = useWebSocketStatus();

        const { isAuthenticated } = useAuth(account, walletClient as any, sessionKey?.address ?? null, wsStatus);
        const { balances, isLoadingBalances } = useBalances(isAuthenticated, sessionKey as any, account as any);

        const [isTransferring, setIsTransferring] = useState(false);
        const [transferStatus, setTransferStatus] = useState<string | null>(null);
        const { handleTransfer: transferFn } = useTransfer(sessionKey as any, isAuthenticated);

        const {
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
        } = useNitroliteAppSessions(isAuthenticated, sessionKey as any, account as any);

        const {
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
        } = useNitroliteState(isAuthenticated, sessionKey as any);

        const handleSupport = async (recipient: string, amount: string) => {
            setIsTransferring(true);
            setTransferStatus('Sending support...');
            const result = await transferFn(recipient as Address, amount);
            if (result.success) {
                setTransferStatus('Support sent!');
            } else {
                setIsTransferring(false);
                setTransferStatus(null);
                if (result.error) alert(result.error);
            }
        };

        useEffect(() => {
            const handleMessage = async (data: any) => {
                const response = parseAnyRPCResponse(JSON.stringify(data));
                if (response.method === RPCMethod.Transfer) {
                    const transferResponse = response as TransferResponse;
                    console.log('Transfer completed:', transferResponse.params);
                    setIsTransferring(false);
                    setTransferStatus(null);
                    alert(`Transfer completed successfully!`);
                }
                if (response.method === RPCMethod.Error) {
                    console.error('RPC Error:', response.params);
                    if (isTransferring) {
                        setIsTransferring(false);
                        setTransferStatus(null);
                        alert(`Transfer failed: ${response.params.error}`);
                    }
                }
            };
            webSocketService.addMessageListener(handleMessage);
            return () => webSocketService.removeMessageListener(handleMessage);
        }, [isTransferring]);

        const formatAddress = (address: Address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

        return (
            <div className="app-container">
                <header className="header">
                    <div className="header-content">
                        <h1 className="logo">Nexus</h1>
                        <p className="tagline">Decentralized insights for the next generation of builders</p>
                    </div>
                    <div className="header-controls">
                        {isAuthenticated && (
                            <BalanceDisplay
                                balance={isLoadingBalances ? 'Loading...' : (balances?.['usdc'] ?? null)}
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
                    {transferStatus && <div className="transfer-status">{transferStatus}</div>}

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
                            <button onClick={handleCreateAppSession} disabled={!isAuthenticated}>Create App Session</button>
                            <button onClick={handleGetSessions} disabled={!isAuthenticated}>Get App Sessions</button>
                            <input
                                type="text"
                                placeholder="App Session ID"
                                value={closeSessionId}
                                onInput={(e: any) => setCloseSessionId(e.currentTarget.value)}
                                style={{ padding: '8px 12px', width: 320 }}
                            />
                            <button onClick={handleCloseSession} disabled={!isAuthenticated}>Close App Session</button>
                        </div>
                        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                            {createResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{createResult}</pre>}
                            {getSessionsResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{getSessionsResult}</pre>}
                            {closeResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{closeResult}</pre>}
                        </div>
                    </section>

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
                            <button onClick={() => handleSubmitAppState(closeSessionId)} disabled={!isAuthenticated || !closeSessionId}>Submit App State</button>
                            <button onClick={handleGetChannels} disabled={!isAuthenticated}>Get Channels</button>
                            <button onClick={() => { setDeriveStateFromHistory(true); handleGetRPCHistory(); }} disabled={!isAuthenticated}>Get RPC History</button>
                        </div>
                        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                            {submitStateResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{submitStateResult}</pre>}
                            {getStateResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{getStateResult}</pre>}
                            {channelsResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{channelsResult}</pre>}
                            {rpcHistoryResult && <pre style={{ whiteSpace: 'pre-wrap' }}>{rpcHistoryResult}</pre>}
                        </div>
                    </section>
                </main>
            </div>
        );
    }
