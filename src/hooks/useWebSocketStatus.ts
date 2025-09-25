import { useEffect, useState } from 'react';
import { webSocketService, type WsStatus } from '../lib/websocket';

export const useWebSocketStatus = () => {
    const [wsStatus, setWsStatus] = useState<WsStatus>('Disconnected');

    useEffect(() => {
        webSocketService.addStatusListener(setWsStatus);
        webSocketService.connect();
        return () => webSocketService.removeStatusListener(setWsStatus);
    }, []);

    return { wsStatus };
};


