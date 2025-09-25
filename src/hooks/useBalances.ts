import { useEffect, useState } from 'react';
import {
    createECDSAMessageSigner,
    createGetLedgerBalancesMessage,
    parseAnyRPCResponse,
    RPCMethod,
    type GetLedgerBalancesResponse,
    type BalanceUpdateResponse,
} from '@erc7824/nitrolite';
import type { Address } from 'viem';
import { webSocketService } from '../lib/websocket';
import type { SessionKey } from '../lib/utils';

export const useBalances = (
    isAuthenticated: boolean,
    sessionKey: SessionKey | null,
    account: Address | null,
) => {
    const [balances, setBalances] = useState<Record<string, string> | null>(null);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    // request balances when ready
    useEffect(() => {
        if (isAuthenticated && sessionKey && account) {
            setIsLoadingBalances(true);
            const sessionSigner = createECDSAMessageSigner(sessionKey.privateKey);
            createGetLedgerBalancesMessage(sessionSigner, account)
                .then((payload) => webSocketService.send(payload))
                .catch(() => setIsLoadingBalances(false));
        }
    }, [isAuthenticated, sessionKey, account]);

    // subscribe to balance responses / updates
    useEffect(() => {
        const handleMessage = (data: any) => {
            const response = parseAnyRPCResponse(JSON.stringify(data));

            if (response.method === RPCMethod.GetLedgerBalances) {
                const balanceResponse = response as GetLedgerBalancesResponse;
                const list = balanceResponse.params.ledgerBalances;
                if (list && list.length > 0) {
                    const map = Object.fromEntries(list.map((b) => [b.asset, b.amount]));
                    setBalances(map);
                } else {
                    setBalances({});
                }
                setIsLoadingBalances(false);
            }

            if (response.method === RPCMethod.BalanceUpdate) {
                const update = response as BalanceUpdateResponse;
                const list = update.params.balanceUpdates;
                const map = Object.fromEntries(list.map((b) => [b.asset, b.amount]));
                setBalances(map);
            }
        };

        webSocketService.addMessageListener(handleMessage);
        return () => webSocketService.removeMessageListener(handleMessage);
    }, []);

    return { balances, isLoadingBalances };
};


