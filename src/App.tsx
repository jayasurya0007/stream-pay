    import { useState } from 'preact/hooks';
    import type { Address } from 'viem';
    import { BalanceDisplay } from './components/BalanceDisplay/BalanceDisplay';
    import { useTransfer } from './hooks/useTransfer';
    import { useStreamingPayments } from './hooks/useStreamingPayments';
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
        const videos = [
            {
                title: 'Big Buck Bunny',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                creator: '0x066ae107Ef0FdF393DeF2f6f546865581482845B',
            },
            {
                title: 'Sintel',
                url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                creator: '0x1Db4634a48aeb9BAC776F20160e31459adCdC0A5',
            },
        ];

        const { account, walletClient, connectWallet } = useWallet();
        const { sessionKey } = useSessionKey();
        const { wsStatus } = useWebSocketStatus();

        const { isAuthenticated } = useAuth(account, walletClient as any, sessionKey?.address ?? null, wsStatus);
        const { balances, isLoadingBalances } = useBalances(isAuthenticated, sessionKey as any, account as any);

        
        const { handleTransfer: transferFn } = useTransfer(sessionKey as any, isAuthenticated);

        // unit helpers (USDC: 6 decimals, ETH: 18 decimals)
        const USDC_DECIMALS = 6n;
        const ETH_DECIMALS = 18n;
        const getDecimalsForAsset = (asset: string): bigint => {
            const a = (asset || '').toLowerCase();
            if (a === 'eth') return ETH_DECIMALS;
            if (a === 'usdc') return USDC_DECIMALS;
            return USDC_DECIMALS;
        };
        const toBaseUnits = (value: string, decimals: bigint): string => {
            const trimmed = (value || '').trim();
            if (!trimmed) return '0';
            if (!trimmed.includes('.')) return (BigInt(trimmed) * 10n ** decimals).toString();
            const [whole, fracRaw] = trimmed.split('.');
            const frac = (fracRaw || '').slice(0, Number(decimals));
            const paddedFrac = frac.padEnd(Number(decimals), '0');
            const wholeInt = whole ? BigInt(whole) : 0n;
            return (wholeInt * 10n ** decimals + BigInt(paddedFrac || '0')).toString();
        };
        const fromBaseUnits = (value: string, decimals: bigint): string => {
            try {
                const v = BigInt(value || '0');
                const d = 10n ** decimals;
                const whole = v / d;
                const frac = (v % d).toString().padStart(Number(decimals), '0').replace(/0+$/, '');
                return frac ? `${whole}.${frac}` : `${whole}`;
            } catch {
                return '0';
            }
        };
        const gte = (a: string, b: string) => {
            try { return BigInt(a) >= BigInt(b); } catch { return false; }
        };
        const availableByAsset = (asset: string): string => {
            const key = (asset || '').toLowerCase();
            return balances?.[key] ?? '0';
        };
        const humanForAsset = (asset: string, base: string): string => fromBaseUnits(base, getDecimalsForAsset(asset));

        const { startStream, stopStream, isStreaming, totalSent } = useStreamingPayments({
            canTransfer: Boolean(isAuthenticated && sessionKey),
            handleTransfer: transferFn as any,
        });

        

        // Pay-as-you-watch controls
        const [payVideoUrl, setPayVideoUrl] = useState<string>('');
        const [payRecipient, setPayRecipient] = useState<string>('');
        const [payAsset, setPayAsset] = useState<string>('usdc');
        const [payRatePerMinute, setPayRatePerMinute] = useState<string>(''); // human units per minute
        const [payTickSeconds, setPayTickSeconds] = useState<number>(5);
        const [payBudgetTotal, setPayBudgetTotal] = useState<string>(''); // session cap in human units

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
            setDeriveStateFromHistory,
            handleSubmitAppState,
            handleGetChannels,
            handleGetRPCHistory,
        } = useNitroliteState(isAuthenticated, sessionKey as any);

        

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
                    

                    <section style={{ marginTop: 24 }}>
                        <h3>Pay As You Watch</h3>
                        <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                            {videos.map((v) => (
                                <div key={v.url} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => { setPayVideoUrl(v.url); setPayRecipient(v.creator); }}
                                        style={{ padding: '6px 10px' }}
                                    >
                                        Select
                                    </button>
                                    <div style={{ fontWeight: 600 }}>{v.title}</div>
                                    <div style={{ opacity: 0.8 }}>Creator: {v.creator}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Video URL (mp4)"
                                value={payVideoUrl}
                                onInput={(e: any) => setPayVideoUrl(e.currentTarget.value)}
                                style={{ padding: '8px 12px', width: 320 }}
                            />
                            <input
                                type="text"
                                placeholder="Recipient (0x...)"
                                value={payRecipient}
                                onInput={(e: any) => setPayRecipient(e.currentTarget.value)}
                                style={{ padding: '8px 12px', width: 320 }}
                            />
                            <select value={payAsset} onChange={(e: any) => setPayAsset(e.currentTarget.value)} style={{ padding: '8px 12px' }}>
                                <option value="usdc">USDC</option>
                                <option value="eth">ETH</option>
                            </select>
                            <input
                                type="text"
                                placeholder={`Rate per minute (${payAsset.toUpperCase()})`}
                                value={payRatePerMinute}
                                onInput={(e: any) => setPayRatePerMinute(e.currentTarget.value)}
                                style={{ padding: '8px 12px', width: 200 }}
                            />
                            <input
                                type="number"
                                placeholder="Tick seconds"
                                min={1}
                                value={payTickSeconds}
                                onInput={(e: any) => setPayTickSeconds(parseInt(e.currentTarget.value || '1', 10))}
                                style={{ padding: '8px 12px', width: 140 }}
                            />
                            <input
                                type="text"
                                placeholder={`Session budget (${payAsset.toUpperCase()})`}
                                value={payBudgetTotal}
                                onInput={(e: any) => setPayBudgetTotal(e.currentTarget.value)}
                                style={{ padding: '8px 12px', width: 220 }}
                            />
                            <div style={{ opacity: 0.8 }}>Available: {humanForAsset(payAsset, availableByAsset(payAsset))} {payAsset.toUpperCase()}</div>
                        </div>
                        <div style={{ marginTop: 12 }}>
                            <video
                                key={payVideoUrl}
                                src={payVideoUrl}
                                controls
                                style={{ width: '100%', maxWidth: 720, background: '#000' }}
                                onPlay={() => {
                                    if (!isAuthenticated || !payRecipient || !payRatePerMinute || !payTickSeconds || !payBudgetTotal) return;
                                    const decimals = getDecimalsForAsset(payAsset);
                                    // amount per tick = (rate per minute) * (tickSeconds / 60)
                                    const ratePerMinuteBase = toBaseUnits(payRatePerMinute, decimals);
                                    const amountPerTickBase = (BigInt(ratePerMinuteBase) * BigInt(Math.max(1, payTickSeconds))) / 60n;
                                    const thresholdBase = toBaseUnits(payBudgetTotal, decimals);
                                    if (!gte(availableByAsset(payAsset), thresholdBase)) {
                                        alert(`Insufficient ${payAsset.toUpperCase()} balance for session budget`);
                                        return;
                                    }
                                    startStream({
                                        recipient: payRecipient as Address,
                                        amountPerTick: amountPerTickBase.toString(),
                                        intervalMs: Math.max(1, payTickSeconds) * 1000,
                                        thresholdTotal: thresholdBase,
                                        asset: payAsset,
                                    });
                                }}
                                onPause={() => {
                                    if (isStreaming) stopStream();
                                }}
                                onEnded={() => {
                                    if (isStreaming) stopStream();
                                }}
                            />
                            <div style={{ marginTop: 8 }}>
                                <div>Streaming status: {isStreaming ? 'Active' : 'Stopped'}</div>
                                <div>Total sent: {fromBaseUnits(totalSent, getDecimalsForAsset(payAsset))} {payAsset.toUpperCase()}</div>
                            </div>
                        </div>
                    </section>

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
