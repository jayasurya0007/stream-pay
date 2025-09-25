import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';

export interface StreamConfig {
    recipient: Address;
    amountPerTick: string; // integer string (e.g., in smallest unit)
    intervalMs: number;
    thresholdTotal: string; // stop when totalSent >= thresholdTotal
    asset?: string; // default 'usdc'
}

export interface StreamState {
    isStreaming: boolean;
    totalSent: string; // integer string
    lastError: string | null;
}

export interface UseStreamingPaymentsDeps {
    canTransfer: boolean;
    handleTransfer: (recipient: Address, amount: string, asset?: string) => Promise<{ success: boolean; error?: string }>;
}

function addIntegerStrings(a: string, b: string): string {
    // Use BigInt arithmetic for integer string addition
    try {
        return (BigInt(a) + BigInt(b)).toString();
    } catch {
        // Fallback: return a if invalid inputs
        return a;
    }
}

function gteIntegerStrings(a: string, b: string): boolean {
    try {
        return BigInt(a) >= BigInt(b);
    } catch {
        return false;
    }
}

export const useStreamingPayments = ({ canTransfer, handleTransfer }: UseStreamingPaymentsDeps) => {
    const [config, setConfig] = useState<StreamConfig | null>(null);
    const [state, setState] = useState<StreamState>({ isStreaming: false, totalSent: '0', lastError: null });
    const intervalRef = useRef<number | null>(null);

    const asset = useMemo(() => config?.asset ?? 'usdc', [config]);

    const stopStream = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setState((s) => ({ ...s, isStreaming: false }));
        setConfig((c) => (c ? { ...c } : c));
    }, []);

    const startStream = useCallback(async (newConfig: StreamConfig) => {
        if (!canTransfer) {
            setState({ isStreaming: false, totalSent: '0', lastError: 'Please authenticate first' });
            return;
        }

        // reset state
        setConfig(newConfig);
        setState({ isStreaming: true, totalSent: '0', lastError: null });

        // immediately send the first tick
        const first = await handleTransfer(newConfig.recipient, newConfig.amountPerTick, newConfig.asset);
        if (!first.success) {
            setState({ isStreaming: false, totalSent: '0', lastError: first.error ?? 'Stream start failed' });
            return;
        }
        setState({ isStreaming: true, totalSent: newConfig.amountPerTick, lastError: null });

        // schedule subsequent ticks
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = window.setInterval(async () => {
            setState((prev) => {
                // If stopped externally, do nothing
                if (!config || !prev.isStreaming) return prev;
                return prev;
            });

            if (!config) return;

            // Check threshold before sending
            const willBeTotal = addIntegerStrings(state.totalSent, config.amountPerTick);
            if (gteIntegerStrings(willBeTotal, config.thresholdTotal)) {
                // send only the remaining amount if will exceed threshold
                const remaining = (BigInt(config.thresholdTotal) - BigInt(state.totalSent)).toString();
                if (gteIntegerStrings(remaining, '0') && remaining !== '0') {
                    const res = await handleTransfer(config.recipient, remaining, config.asset);
                    if (!res.success) {
                        setState((s) => ({ ...s, isStreaming: false, lastError: res.error ?? 'Stream error' }));
                        stopStream();
                        return;
                    }
                    setState((s) => ({ ...s, totalSent: addIntegerStrings(s.totalSent, remaining) }));
                }
                stopStream();
                return;
            }

            const res = await handleTransfer(config.recipient, config.amountPerTick, config.asset);
            if (!res.success) {
                setState((s) => ({ ...s, isStreaming: false, lastError: res.error ?? 'Stream error' }));
                stopStream();
                return;
            }
            setState((s) => ({ ...s, totalSent: addIntegerStrings(s.totalSent, config.amountPerTick) }));
        }, newConfig.intervalMs);
    }, [canTransfer, handleTransfer, stopStream, config, state.totalSent]);

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        startStream,
        stopStream,
        isStreaming: state.isStreaming,
        totalSent: state.totalSent,
        lastError: state.lastError,
        currentAsset: asset,
        currentConfig: config,
    };
};


