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
            if (!walletClient || !account) {
                alert('Please connect your wallet first');
                return;
            }

            if (!fundAmount || fundAmount.trim() === '') {
                alert('Please enter an amount to deposit');
                return;
            }

            try {
                // Get contract addresses from environment variables
                const custodyAddress = import.meta.env.VITE_CUSTODY_ADDRESS;
                const adjudicatorAddress = import.meta.env.VITE_ADJUDICATOR_ADDRESS;
                const usdcTokenAddress = import.meta.env.VITE_USDC_TOKEN_ADDRESS;

                if (!custodyAddress || !adjudicatorAddress) {
                    alert('Missing contract addresses in environment variables. Please set VITE_CUSTODY_ADDRESS and VITE_ADJUDICATOR_ADDRESS');
                    return;
                }

                if (fundAsset.toLowerCase() === 'usdc' && !usdcTokenAddress) {
                    alert('Missing USDC token address in environment variables. Please set VITE_USDC_TOKEN_ADDRESS');
                    return;
                }

                // Convert amount to proper units
                const decimals = getDecimalsForAsset(fundAsset);
                const amountBase = toBaseUnits(fundAmount, decimals);
                const amountBigInt = BigInt(amountBase);

                if (amountBigInt <= 0n) {
                    alert('Amount must be greater than 0');
                    return;
                }

                // Dynamic imports to avoid TypeScript issues
                const { NitroliteClient } = await import('@erc7824/nitrolite');
                const { createPublicClient, http } = await import('viem');
                const { base } = await import('viem/chains');

                // Create public client for Base network
                const publicClient = createPublicClient({
                    chain: base,
                    transport: http()
                });

                // Create Nitrolite client with type assertions to handle version conflicts
                const client = new NitroliteClient({
                    publicClient: publicClient as any,
                    walletClient: walletClient as any,
                    stateSigner: walletClient as any, // Use wallet client as state signer
                    addresses: {
                        custody: custodyAddress as Address,
                        adjudicator: adjudicatorAddress as Address,
                        guestAddress: account,
                    },
                    chainId: 8453, // Base mainnet
                    challengeDuration: 3600n // Minimum required: 3600 seconds (1 hour)
                });

                // Show confirmation dialog
                const confirmed = confirm(`Deposit ${fundAmount} ${fundAsset.toUpperCase()} to your Nitrolite ledger?\n\nThis will require gas fees for the onchain transaction.`);
                if (!confirmed) return;

                // Check if user is on the correct network (Base)
                const currentChainId = await walletClient.getChainId();
                if (currentChainId !== 8453) {
                    const switchConfirmed = confirm(`You need to switch to Base network to make deposits.\n\nCurrent: ${currentChainId === 1 ? 'Ethereum Mainnet' : `Chain ${currentChainId}`}\nRequired: Base (8453)\n\nWould you like to switch to Base network?`);
                    if (!switchConfirmed) return;
                    
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x2105' }], // 8453 in hex
                        });
                    } catch (switchError: any) {
                        if (switchError.code === 4902) {
                            // Network not added, add it
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base',
                                    rpcUrls: ['https://mainnet.base.org'],
                                    nativeCurrency: {
                                        name: 'Ethereum',
                                        symbol: 'ETH',
                                        decimals: 18,
                                    },
                                    blockExplorerUrls: ['https://basescan.org'],
                                }],
                            });
            } else {
                            alert('Failed to switch to Base network. Please switch manually in MetaMask.');
                            return;
                        }
                    }
                }

                // For USDC, we need to approve the custody contract first
                if (fundAsset.toLowerCase() === 'usdc') {
                    try {
                        // Check current allowance
                        const currentAllowance = await publicClient.readContract({
                            address: usdcTokenAddress as Address,
                            abi: [
                                {
                                    name: 'allowance',
                                    type: 'function',
                                    stateMutability: 'view',
                                    inputs: [
                                        { name: 'owner', type: 'address' },
                                        { name: 'spender', type: 'address' }
                                    ],
                                    outputs: [{ name: '', type: 'uint256' }]
                                }
                            ],
                            functionName: 'allowance',
                            args: [account, custodyAddress as Address]
                        });

                        // If allowance is insufficient, approve the custody contract
                        if (currentAllowance < amountBigInt) {
                            const approveConfirmed = confirm(`Approve ${fundAmount} ${fundAsset.toUpperCase()} for Nitrolite custody contract?\n\nThis is required before depositing USDC.`);
                            if (!approveConfirmed) return;

                            const approveTxHash = await walletClient.writeContract({
                                address: usdcTokenAddress as Address,
                                abi: [
                                    {
                                        name: 'approve',
                                        type: 'function',
                                        stateMutability: 'nonpayable',
                                        inputs: [
                                            { name: 'spender', type: 'address' },
                                            { name: 'amount', type: 'uint256' }
                                        ],
                                        outputs: [{ name: '', type: 'bool' }]
                                    }
                                ],
                                functionName: 'approve',
                                args: [custodyAddress as Address, amountBigInt],
                                account: account,
                                chain: walletClient.chain
                            });

                            alert(`✅ USDC approval successful!\n\nTransaction Hash: ${approveTxHash}\n\nNow proceeding with deposit...`);
                        }
                    } catch (approveError) {
                        console.error('USDC approval failed:', approveError);
                        alert(`❌ USDC approval failed: ${approveError instanceof Error ? approveError.message : 'Unknown error'}`);
                        return;
                    }
                }

                // Execute deposit
                const tokenAddress = fundAsset.toLowerCase() === 'usdc' ? usdcTokenAddress as Address : undefined;
                const txHash = await client.deposit(amountBigInt as any, tokenAddress as any);
                
                alert(`✅ Deposit successful!\n\nTransaction Hash: ${txHash}\nAmount: ${fundAmount} ${fundAsset.toUpperCase()}\n\nYour ledger balance will be updated once the transaction is confirmed.`);
                
                // Clear the amount field
                setFundAmount('');
                
            } catch (error) {
                console.error('Deposit failed:', error);
                let errorMessage = 'Unknown error occurred';
                
                if (error instanceof Error) {
                    errorMessage = error.message;
                    
                    // Handle specific error cases
                    if (errorMessage.includes('insufficient funds')) {
                        errorMessage = 'Insufficient funds in your wallet for this deposit';
                    } else if (errorMessage.includes('user rejected')) {
                        errorMessage = 'Transaction was rejected by user';
                    } else if (errorMessage.includes('gas')) {
                        errorMessage = 'Gas estimation failed. Please try with a smaller amount or check your wallet balance';
                    } else if (errorMessage.includes('allowance')) {
                        errorMessage = 'USDC token approval failed. Please check if the USDC contract address is correct for Base network';
                    } else if (errorMessage.includes('Failed to read from contract')) {
                        errorMessage = 'Contract interaction failed. Please verify the contract addresses are correct for Base network';
                    }
                }
                
                alert(`❌ Deposit failed: ${errorMessage}`);
            }
        };
        const handleWithdraw = async () => {
            if (!walletClient || !account) {
                alert('Please connect your wallet first');
                return;
            }

            if (!fundAmount || fundAmount.trim() === '') {
                alert('Please enter an amount to withdraw');
                return;
            }

            try {
                // Get contract addresses from environment variables
                const custodyAddress = import.meta.env.VITE_CUSTODY_ADDRESS;
                const adjudicatorAddress = import.meta.env.VITE_ADJUDICATOR_ADDRESS;
                const usdcTokenAddress = import.meta.env.VITE_USDC_TOKEN_ADDRESS;

                if (!custodyAddress || !adjudicatorAddress) {
                    alert('Missing contract addresses in environment variables. Please set VITE_CUSTODY_ADDRESS and VITE_ADJUDICATOR_ADDRESS');
                    return;
                }

                if (fundAsset.toLowerCase() === 'usdc' && !usdcTokenAddress) {
                    alert('Missing USDC token address in environment variables. Please set VITE_USDC_TOKEN_ADDRESS');
                    return;
                }

                // Convert amount to proper units
                const decimals = getDecimalsForAsset(fundAsset);
                const amountBase = toBaseUnits(fundAmount, decimals);
                const amountBigInt = BigInt(amountBase);

                if (amountBigInt <= 0n) {
                    alert('Amount must be greater than 0');
                    return;
                }

                // Check if user has sufficient ledger balance
                const availableBalance = availableByAsset(fundAsset);
                if (!gte(availableBalance, amountBase)) {
                    const availableHuman = humanForAsset(fundAsset, availableBalance);
                    alert(`Insufficient ledger balance. Available: ${availableHuman} ${fundAsset.toUpperCase()}, Requested: ${fundAmount} ${fundAsset.toUpperCase()}`);
                    return;
                }

                // Dynamic imports to avoid TypeScript issues
                const { NitroliteClient } = await import('@erc7824/nitrolite');
                const { createPublicClient, http } = await import('viem');
                const { base } = await import('viem/chains');

                // Create public client for Base network
                const publicClient = createPublicClient({
                    chain: base,
                    transport: http()
                });

                // Create Nitrolite client with type assertions to handle version conflicts
                const client = new NitroliteClient({
                    publicClient: publicClient as any,
                    walletClient: walletClient as any,
                    stateSigner: walletClient as any, // Use wallet client as state signer
                    addresses: {
                        custody: custodyAddress as Address,
                        adjudicator: adjudicatorAddress as Address,
                        guestAddress: account,
                    },
                    chainId: 8453, // Base mainnet
                    challengeDuration: 3600n // Minimum required: 3600 seconds (1 hour)
                });

                // Show confirmation dialog
                const confirmed = confirm(`Withdraw ${fundAmount} ${fundAsset.toUpperCase()} from your Nitrolite ledger to your wallet?\n\nThis will require gas fees for the onchain transaction.`);
                if (!confirmed) return;

                // Check if user is on the correct network (Base)
                const currentChainId = await walletClient.getChainId();
                if (currentChainId !== 8453) {
                    const switchConfirmed = confirm(`You need to switch to Base network to make withdrawals.\n\nCurrent: ${currentChainId === 1 ? 'Ethereum Mainnet' : `Chain ${currentChainId}`}\nRequired: Base (8453)\n\nWould you like to switch to Base network?`);
                    if (!switchConfirmed) return;
                    
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0x2105' }], // 8453 in hex
                        });
                    } catch (switchError: any) {
                        if (switchError.code === 4902) {
                            // Network not added, add it
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: '0x2105',
                                    chainName: 'Base',
                                    rpcUrls: ['https://mainnet.base.org'],
                                    nativeCurrency: {
                                        name: 'Ethereum',
                                        symbol: 'ETH',
                                        decimals: 18,
                                    },
                                    blockExplorerUrls: ['https://basescan.org'],
                                }],
                            });
                        } else {
                            alert('Failed to switch to Base network. Please switch manually in MetaMask.');
                            return;
                        }
                    }
                }

                // Execute withdrawal
                const tokenAddress = fundAsset.toLowerCase() === 'usdc' ? usdcTokenAddress as Address : undefined;
                const txHash = await client.withdrawal(amountBigInt as any, tokenAddress as any);
                
                alert(`✅ Withdrawal successful!\n\nTransaction Hash: ${txHash}\nAmount: ${fundAmount} ${fundAsset.toUpperCase()}\n\nYour wallet balance will be updated once the transaction is confirmed.`);
                
                // Clear the amount field
                setFundAmount('');
                
            } catch (error) {
                console.error('Withdraw failed:', error);
                let errorMessage = 'Unknown error occurred';
                
                if (error instanceof Error) {
                    errorMessage = error.message;
                    
                    // Handle specific error cases
                    if (errorMessage.includes('insufficient funds')) {
                        errorMessage = 'Insufficient funds in your ledger for this withdrawal';
                    } else if (errorMessage.includes('user rejected')) {
                        errorMessage = 'Transaction was rejected by user';
                    } else if (errorMessage.includes('gas')) {
                        errorMessage = 'Gas estimation failed. Please try with a smaller amount or check your wallet balance';
                    } else if (errorMessage.includes('challenge')) {
                        errorMessage = 'Withdrawal is in challenge period. Please wait for the challenge period to end';
                    }
                }
                
                alert(`❌ Withdrawal failed: ${errorMessage}`);
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
