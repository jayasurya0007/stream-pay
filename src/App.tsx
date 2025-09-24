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

        // Deposit / Withdraw UI state (requires onchain integration details)
        const [fundAsset, setFundAsset] = useState<string>('usdc');
        const [fundAmount, setFundAmount] = useState<string>('');
        const handleDeposit = async () => {
            if (!isAuthenticated || !sessionKey || !account) {
                alert('Please authenticate first');
                return;
            }

            try {
                // Use Nitrolite's native deposit RPC
                // This would use Nitrolite's deposit RPC method
                // You'll need to implement the actual deposit message creation
                alert(`Deposit functionality requires Nitrolite deposit RPC implementation. Amount: ${fundAmount} ${fundAsset.toUpperCase()}`);
                
            } catch (error) {
                console.error('Deposit failed:', error);
                alert(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        const handleWithdraw = async () => {
            if (!isAuthenticated || !sessionKey || !account) {
                alert('Please authenticate first');
                return;
            }

            try {
                // Use Nitrolite's native withdraw RPC
                // This would use Nitrolite's withdraw RPC method
                // You'll need to implement the actual withdraw message creation
                alert(`Withdraw functionality requires Nitrolite withdraw RPC implementation. Amount: ${fundAmount} ${fundAsset.toUpperCase()}`);
                
            } catch (error) {
                console.error('Withdraw failed:', error);
                alert(`Withdraw failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };

        const { startStream, stopStream, isStreaming, totalSent } = useStreamingPayments({
            canTransfer: Boolean(isAuthenticated && sessionKey),
            handleTransfer: transferFn as any,
        });

        

        // Pay-as-you-watch controls
        const [payVideoUrl, setPayVideoUrl] = useState<string>('');
        const [payRecipient, setPayRecipient] = useState<string>('');
        const [payAsset] = useState<string>('usdc');
        const [payRatePerMinute] = useState<string>('0.01'); // fixed default
        const [payTickSeconds] = useState<number>(10); // fixed default
        const [payBudgetTotal, setPayBudgetTotal] = useState<string>(''); // session cap in human units
        const [budgetsByUrl, setBudgetsByUrl] = useState<Record<string, string>>({});

        

        

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
                        <h3>Funding (Deposit / Withdraw)</h3>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <select value={fundAsset} onChange={(e: any) => setFundAsset(e.currentTarget.value)} style={{ padding: '8px 12px' }}>
                                <option value="usdc">USDC</option>
                                <option value="eth">ETH</option>
                            </select>
                            <input
                                type="text"
                                placeholder={`Amount (${fundAsset.toUpperCase()})`}
                                value={fundAmount}
                                onInput={(e: any) => setFundAmount(e.currentTarget.value)}
                                style={{ padding: '8px 12px', width: 200 }}
                            />
                            <button disabled={!isAuthenticated || !fundAmount} onClick={handleDeposit}>Deposit to Ledger</button>
                            <button disabled={!isAuthenticated || !fundAmount} onClick={handleWithdraw}>Withdraw to Wallet</button>
                            <div style={{ opacity: 0.8 }}>Ledger balance: {humanForAsset(fundAsset, availableByAsset(fundAsset))} {fundAsset.toUpperCase()}</div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                            Onchain actions require gas. Once deposited, pay-as-you-watch uses your ledger balance off-chain.
                        </div>
                    </section>

                    <section style={{ marginTop: 24 }}>
                        <h3>Pay As You Watch</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 16 }}>
                            {videos.map((v) => (
                                <div key={v.url} style={{ border: '1px solid var(--border, #333)', borderRadius: 8, padding: 12, display: 'grid', gap: 8 }}>
                                    <div style={{ fontWeight: 600 }}>{v.title}</div>
                                    <div style={{ fontSize: 12, opacity: 0.8, wordBreak: 'break-all' }}>Creator: {v.creator}</div>
                            <input
                                type="text"
                                        placeholder={`Session budget (USDC)`}
                                        value={budgetsByUrl[v.url] ?? ''}
                                        onInput={(e: any) => setBudgetsByUrl((m) => ({ ...m, [v.url]: e.currentTarget.value }))}
                                        style={{ padding: '8px 12px', width: '100%' }}
                                    />
                                    <button
                                        onClick={() => { setPayVideoUrl(v.url); setPayRecipient(v.creator); setPayBudgetTotal(budgetsByUrl[v.url] ?? ''); }}
                                        disabled={!isAuthenticated || !(budgetsByUrl[v.url] ?? '').trim()}
                                    >
                                        Watch
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div>
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

                    
                </main>
            </div>
        );
    }
