import { useState, useCallback } from 'preact/hooks';
import { createWalletClient, custom, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';

declare global {
    interface Window {
        ethereum?: any;
    }
}

export const useWallet = () => {
    const [account, setAccount] = useState<Address | null>(null);
    const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            alert('MetaMask not found! Please install MetaMask from https://metamask.io/');
            return;
        }

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x1') {
                alert('Please switch to Ethereum Mainnet in MetaMask for this workshop');
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

            const client = createWalletClient({
                account: address,
                chain: mainnet,
                transport: custom(window.ethereum),
            });

            setWalletClient(client);
            setAccount(address);
        } catch (error) {
            console.error('Wallet connection failed:', error);
            alert('Failed to connect wallet. Please try again.');
            return;
        }
    }, []);

    return { account, walletClient, connectWallet };
};


