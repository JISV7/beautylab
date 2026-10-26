import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildCommunitySocketUrl,
  type ChatMessage,
  type CommunityOnlineUser,
} from '../../lib/communityApi';

export type CommunitySocketStatus = 'connecting' | 'connected' | 'disconnected';

interface TypingUserEvent {
  user_id: string;
  user_name: string;
}

interface UseCommunitySocketOptions {
  roomId: string | null;
  token: string | null;
  onMessage: (message: ChatMessage) => void;
  onPresence: (users: CommunityOnlineUser[]) => void;
  onTyping: (user: TypingUserEvent) => void;
  onError?: (detail: string) => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;

export function useCommunitySocket({
  roomId,
  token,
  onMessage,
  onPresence,
  onTyping,
  onError,
}: UseCommunitySocketOptions) {
  const [status, setStatus] =
    useState<CommunitySocketStatus>('disconnected');
  const [reconnectKey, setReconnectKey] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const callbacksRef = useRef({ onMessage, onPresence, onTyping, onError });

  useEffect(() => {
    callbacksRef.current = { onMessage, onPresence, onTyping, onError };
  }, [onMessage, onPresence, onTyping, onError]);

  useEffect(() => {
    if (!roomId || !token) {
      setStatus('disconnected');
      return;
    }

    let disposed = false;
    let attempts = 0;
    let retryTimer: number | null = null;

    const scheduleReconnect = () => {
      if (disposed) return;
      if (attempts >= MAX_RECONNECT_ATTEMPTS) {
        setStatus('disconnected');
        return;
      }
      const delay = Math.min(750 * 2 ** attempts, 6000);
      attempts += 1;
      setStatus('connecting');
      retryTimer = window.setTimeout(connect, delay);
    };

    const connect = () => {
      if (disposed) return;
      setStatus('connecting');

      let socket: WebSocket;
      try {
        socket = new WebSocket(buildCommunitySocketUrl(token, roomId));
      } catch {
        scheduleReconnect();
        return;
      }

      socketRef.current = socket;

      socket.onopen = () => {
        if (disposed) return;
        attempts = 0;
        setStatus('connected');
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        let payload: unknown;
        try {
          payload = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (!payload || typeof payload !== 'object') return;
        const data = payload as Record<string, unknown>;

        if (data.type === 'message' && data.message) {
          callbacksRef.current.onMessage(data.message as ChatMessage);
          return;
        }
        if (
          (data.type === 'ready' || data.type === 'presence') &&
          Array.isArray(data.online_users)
        ) {
          callbacksRef.current.onPresence(
            data.online_users as CommunityOnlineUser[],
          );
          return;
        }
        if (
          data.type === 'typing' &&
          typeof data.user_id === 'string' &&
          typeof data.user_name === 'string'
        ) {
          callbacksRef.current.onTyping({
            user_id: data.user_id,
            user_name: data.user_name,
          });
          return;
        }
        if (data.type === 'error' && typeof data.detail === 'string') {
          callbacksRef.current.onError?.(data.detail);
        }
      };

      socket.onerror = () => {
        // The close event owns retry scheduling and status transitions.
        if (socket.readyState < WebSocket.CLOSING) {
          socket.close();
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        if (socketRef.current === socket) {
          socketRef.current = null;
        }
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }
    };
  }, [roomId, token, reconnectKey]);

  const sendMessage = useCallback((content: string): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type: 'message', content }));
    return true;
  }, []);

  const sendTyping = useCallback((): boolean => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ type: 'typing' }));
    return true;
  }, []);

  const reconnect = useCallback(() => {
    setReconnectKey((current) => current + 1);
  }, []);

  return { status, sendMessage, sendTyping, reconnect };
}
