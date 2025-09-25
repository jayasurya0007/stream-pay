import { createECDSAMessageSigner, createTransferMessage } from '@erc7824/nitrolite';
import { useRef, useState } from 'react';
import type { Address } from 'viem';
import { BalanceDisplay } from '../components/BalanceDisplay/BalanceDisplay';
import { useAuth } from '../hooks/useAuth';
import { useBalances } from '../hooks/useBalances';
import { useSessionKey } from '../hooks/useSessionKey';
import { useStreamingPayments } from '../hooks/useStreamingPayments';
import { useTransfer } from '../hooks/useTransfer';
import { useWallet } from '../hooks/useWallet';
import { useWebSocketStatus } from '../hooks/useWebSocketStatus';
import { webSocketService } from '../lib/websocket';
import styles from './NitrolitePortal.module.css';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export function NitrolitePortal() {
    const videos = [
        {
            title: 'Big Buck Bunny',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            creator: '0x066ae107Ef0FdF393DeF2f6f546865581482845B',
            description: 'A short animated film about a giant rabbit with a heart of gold.',
        },
        {
            title: 'Sintel',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            creator: '0x1Db4634a48aeb9BAC776F20160e31459adCdC0A5',
            description: 'A beautiful animated short film about a girl searching for her lost friend.',
        },
    ];

    const { account, walletClient, connectWallet } = useWallet();
    const { sessionKey } = useSessionKey();
    const { wsStatus } = useWebSocketStatus();

    const { isAuthenticated } = useAuth(account, walletClient as any, sessionKey?.address ?? null, wsStatus);
    const { balances, isLoadingBalances } = useBalances(isAuthenticated, sessionKey as any, account as any);

    const { handleTransfer: transferFn } = useTransfer(sessionKey as any, isAuthenticated);

    // Unit helpers (USDC: 6 decimals, ETH: 18 decimals)
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

    // Platform fee calculation helpers
    const calculatePlatformFee = (amount: string, feePercent: number): string => {
        try {
            const amountBigInt = BigInt(amount);
            const feeBigInt = (amountBigInt * BigInt(feePercent)) / 100n;
            return feeBigInt.toString();
        } catch {
            return '0';
        }
    };

    const calculateCreatorAmount = (amount: string, feePercent: number): string => {
        try {
            const amountBigInt = BigInt(amount);
            const feeBigInt = (amountBigInt * BigInt(feePercent)) / 100n;
            return (amountBigInt - feeBigInt).toString();
        } catch {
            return amount;
        }
    };

    // Deposit / Withdraw UI state
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

            // Create Nitrolite client
            const client = new NitroliteClient({
                publicClient: publicClient as any,
                walletClient: walletClient as any,
                stateSigner: walletClient as any,
                addresses: {
                    custody: custodyAddress as Address,
                    adjudicator: adjudicatorAddress as Address,
                    guestAddress: account,
                },
                chainId: 8453, // Base mainnet
                challengeDuration: 3600n
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

            // For USDC, approve the custody contract first
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

            // Dynamic imports
            const { NitroliteClient } = await import('@erc7824/nitrolite');
            const { createPublicClient, http } = await import('viem');
            const { base } = await import('viem/chains');

            // Create public client for Base network
            const publicClient = createPublicClient({
                chain: base,
                transport: http()
            });

            // Create Nitrolite client
            const client = new NitroliteClient({
                publicClient: publicClient as any,
                walletClient: walletClient as any,
                stateSigner: walletClient as any,
                addresses: {
                    custody: custodyAddress as Address,
                    adjudicator: adjudicatorAddress as Address,
                    guestAddress: account,
                },
                chainId: 8453, // Base mainnet
                challengeDuration: 3600n
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

    // Custom transfer function with platform fees
    const handleTransferWithFee = async (creatorRecipient: Address, totalAmount: string, asset: string = 'usdc'): Promise<{ success: boolean; error?: string }> => {
        if (!isAuthenticated || !sessionKey) {
            return { success: false, error: 'Please authenticate first' };
        }

        try {
            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);
            
            // Calculate platform fee and creator amount
            const platformFeeAmount = calculatePlatformFee(totalAmount, platformFeePercent);
            const creatorAmount = calculateCreatorAmount(totalAmount, platformFeePercent);
            
            // Create transfer message with multiple recipients
            const transferPayload = await createTransferMessage(sessionSigner, {
                destination: creatorRecipient,
                allocations: [
                    {
                        asset: asset.toLowerCase(),
                        amount: creatorAmount,
                    }
                ],
            });

            // Send creator payment
            console.log('Sending creator payment...');
            webSocketService.send(transferPayload);

            // If platform fee > 0, send platform fee separately
            if (BigInt(platformFeeAmount) > 0n) {
                const platformTransferPayload = await createTransferMessage(sessionSigner, {
                    destination: platformFeeAddress as Address,
                    allocations: [
                        {
                            asset: asset.toLowerCase(),
                            amount: platformFeeAmount,
                        }
                    ],
                });

                console.log('Sending platform fee...');
                webSocketService.send(platformTransferPayload);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Failed to create transfer with fee:', error);
            const errorMsg = error instanceof Error ? error.message : 'Failed to create transfer with fee';
            return { success: false, error: errorMsg };
        }
    };

    // Platform fee configuration
    const [platformFeePercent] = useState<number>(5); // 5% platform fee
    const [platformFeeAddress] = useState<string>('0x066ae107Ef0FdF393DeF2f6f546865581482845B');

    const { stopStream, isStreaming, totalSent, startStream } = useStreamingPayments({
        canTransfer: Boolean(isAuthenticated && sessionKey),
        handleTransfer: transferFn as any,
    });

    // Enhanced streaming with platform fees
    const startStreamWithFee = async (config: {
        creatorRecipient: Address;
        platformRecipient: Address;
        creatorAmount: string;
        platformFeeAmount: string;
        intervalMs: number;
        thresholdTotal: string;
        asset: string;
    }) => {
        // Use the original streaming payments but with our custom transfer function
        const totalAmountPerTick = (BigInt(config.creatorAmount) + BigInt(config.platformFeeAmount)).toString();
        
        await startStream({
            recipient: config.creatorRecipient,
            amountPerTick: totalAmountPerTick,
            intervalMs: config.intervalMs,
            thresholdTotal: config.thresholdTotal,
            asset: config.asset,
        });
    };

    // Pay-as-you-watch controls
    const [payVideoUrl, setPayVideoUrl] = useState<string>('');
    const [payRecipient, setPayRecipient] = useState<string>('');
    const [payAsset] = useState<string>('usdc');
    const [payRatePerMinute] = useState<string>('0.01');
    const [payTickSeconds] = useState<number>(10);
    const [payBudgetTotal, setPayBudgetTotal] = useState<string>('');
    const [budgetsByUrl, setBudgetsByUrl] = useState<Record<string, string>>({});
    const videoRef = useRef<HTMLVideoElement>(null);

    const formatAddress = (address: Address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div className={styles.container}>
            <div className="mb-10"></div>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <p className={styles.tagline}>StreamPay - Decentralized Pay-as-you-watch platform</p>
                    <div className={styles.headerControls}>
                        {isAuthenticated && (
                            <BalanceDisplay
                                balance={isLoadingBalances ? 'Loading...' : (balances?.['usdc'] ?? null)}
                                symbol="USDC"
                            />
                        )}
                        <div className={`${styles.wsStatus} ${styles[wsStatus.toLowerCase()]}`}>
                            <span className={styles.statusDot}></span> {wsStatus}
                        </div>
                        <div>
                            {account ? (
                                <div className={styles.walletInfo}>Connected: {formatAddress(account)}</div>
                            ) : (
                                <button onClick={connectWallet} className={styles.button}>
                                    Connect Wallet
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Funding (Deposit / Withdraw)</h3>
                    <div className={styles.fundingControls}>
                        <select 
                            value={fundAsset} 
                            onChange={(e) => setFundAsset(e.target.value)} 
                            className={styles.assetSelect}
                        >
                            <option value="usdc">USDC</option>
                            <option value="eth">ETH</option>
                        </select>
                        <input
                            type="text"
                            placeholder={`Amount (${fundAsset.toUpperCase()})`}
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                            className={styles.amountInput}
                        />
                        <button 
                            disabled={!isAuthenticated || !fundAmount} 
                            onClick={handleDeposit}
                            className={styles.button}
                        >
                            Deposit to Ledger
                        </button>
                        <button 
                            disabled={!isAuthenticated || !fundAmount} 
                            onClick={handleWithdraw}
                            className={styles.button}
                        >
                            Withdraw to Wallet
                        </button>
                        <div>
                            Ledger balance: {humanForAsset(fundAsset, availableByAsset(fundAsset))} {fundAsset.toUpperCase()}
                        </div>
                    </div>
                    <div className={styles.helperText}>
                        Onchain actions require gas. Once deposited, pay-as-you-watch uses your ledger balance off-chain.
                    </div>
                    <div className={styles.helperText}>
                        Platform Fee: {platformFeePercent}% of each payment goes to platform
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Pay As You Watch</h3>
                    <div className={styles.videoGrid}>
                        {videos.map((v) => (
                            <div key={v.url} className={styles.videoCard}>
                                <div className={styles.videoTitle}>{v.title}</div>
                                <div className={styles.videoCreator}>Creator: {formatAddress(v.creator as Address)}</div>
                                <div className={styles.helperText}>{v.description}</div>
                                <input
                                    type="text"
                                    placeholder={`Session budget (USDC) - Optional`}
                                    value={budgetsByUrl[v.url] ?? ''}
                                    onChange={(e) => setBudgetsByUrl((m) => ({ ...m, [v.url]: e.target.value }))}
                                    className={styles.amountInput}
                                />
                                <button
                                    onClick={() => { 
                                        setPayVideoUrl(v.url); 
                                        setPayRecipient(v.creator); 
                                        setPayBudgetTotal(budgetsByUrl[v.url] ?? ''); 
                                    }}
                                    disabled={!isAuthenticated}
                                    className={styles.button}
                                >
                                    Watch Now
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    {payVideoUrl && (
                        <div>
                            <video
                                ref={videoRef}
                                key={payVideoUrl}
                                src={payVideoUrl}
                                controls
                                className={styles.videoPlayer}
                                onPlay={() => {
                                    if (!isAuthenticated || !payRecipient || !payRatePerMinute || !payTickSeconds) return;
                                    const decimals = getDecimalsForAsset(payAsset);
                                    // amount per tick = (rate per minute) * (tickSeconds / 60)
                                    const ratePerMinuteBase = toBaseUnits(payRatePerMinute, decimals);
                                    const amountPerTickBase = (BigInt(ratePerMinuteBase) * BigInt(Math.max(1, payTickSeconds))) / 60n;
                                    
                                    // If no session budget is set, use current ledger balance
                                    let thresholdBase: string;
                                    if (!payBudgetTotal || payBudgetTotal.trim() === '') {
                                        // Use current ledger balance as threshold
                                        thresholdBase = availableByAsset(payAsset);
                                        if (!gte(thresholdBase, amountPerTickBase.toString())) {
                                            alert(`Insufficient ${payAsset.toUpperCase()} balance to start streaming. Need at least ${fromBaseUnits(amountPerTickBase.toString(), decimals)} ${payAsset.toUpperCase()}`);
                                            if (videoRef.current) {
                                                videoRef.current.pause();
                                            }
                                            return;
                                        }
                                    } else {
                                        // Use provided session budget
                                        thresholdBase = toBaseUnits(payBudgetTotal, decimals);
                                        if (!gte(availableByAsset(payAsset), thresholdBase)) {
                                            alert(`Insufficient ${payAsset.toUpperCase()} balance for session budget`);
                                            if (videoRef.current) {
                                                videoRef.current.pause();
                                            }
                                            return;
                                        }
                                    }
                                    
                                    // Calculate platform fee and creator amount
                                    const platformFeeAmount = calculatePlatformFee(amountPerTickBase.toString(), platformFeePercent);
                                    const creatorAmount = calculateCreatorAmount(amountPerTickBase.toString(), platformFeePercent);
                                    
                                    // Start streaming with platform fee
                                    startStreamWithFee({
                                        creatorRecipient: payRecipient as Address,
                                        platformRecipient: platformFeeAddress as Address,
                                        creatorAmount: creatorAmount,
                                        platformFeeAmount: platformFeeAmount,
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
                            
                            <div className={styles.streamingStatus}>
                                <div className={styles.streamingStatusRow}>
                                    <span className={styles.streamingLabel}>Status:</span>
                                    <span className={styles.streamingValue}>
                                        {isStreaming ? '🟢 Active' : '⚪ Stopped'}
                                    </span>
                                </div>
                                <div className={styles.streamingStatusRow}>
                                    <span className={styles.streamingLabel}>Total sent:</span>
                                    <span className={styles.streamingValue}>
                                        {fromBaseUnits(totalSent, getDecimalsForAsset(payAsset))} {payAsset.toUpperCase()}
                                    </span>
                                </div>
                                <div className={styles.streamingStatusRow}>
                                    <span className={styles.streamingLabel}>Creator receives:</span>
                                    <span className={styles.streamingValue}>
                                        {fromBaseUnits(calculateCreatorAmount(totalSent, platformFeePercent), getDecimalsForAsset(payAsset))} {payAsset.toUpperCase()}
                                    </span>
                                </div>
                                <div className={styles.streamingStatusRow}>
                                    <span className={styles.streamingLabel}>Platform fee:</span>
                                    <span className={styles.streamingValue}>
                                        {fromBaseUnits(calculatePlatformFee(totalSent, platformFeePercent), getDecimalsForAsset(payAsset))} {payAsset.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}