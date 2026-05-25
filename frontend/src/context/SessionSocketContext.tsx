'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store';

export interface Participant {
  socketId: string;
  userId: string;
  name: string;
  peerId?: string;
}

interface SessionSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  participants: Participant[];
  addSystemMessage: ((text: string) => void) | null;
  setSystemMessageHandler: (fn: (text: string) => void) => void;
}

const SessionSocketContext = createContext<SessionSocketContextValue>({
  socket: null,
  isConnected: false,
  participants: [],
  addSystemMessage: null,
  setSystemMessageHandler: () => {},
});

export function SessionSocketProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  const { user, accessToken } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [systemMsgHandler, setSystemMsgHandlerState] = useState<((text: string) => void) | null>(
    null
  );

  const setSystemMessageHandler = useCallback((fn: (text: string) => void) => {
    setSystemMsgHandlerState(() => fn);
  }, []);

  useEffect(() => {
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';

    const s = io(WS_URL, {
      autoConnect: false,
      auth: { token: accessToken || '' },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const onConnect = () => {
      setIsConnected(true);
      s.emit('join-room', {
        roomId: sessionId,
        userId: user?.id ?? '',
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      });
    };

    const onDisconnect = () => setIsConnected(false);

    const onRoomUsers = (users: Participant[]) => setParticipants(users);

    const onUserJoined = (data: { socketId: string; userId: string; name: string; peerId?: string }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === data.socketId)) return prev;
        return [...prev, data];
      });
      setSystemMsgHandlerState((fn: ((text: string) => void) | null) => {
        fn?.(`${data.name} joined the session`);
        return fn;
      });
    };

    const onUserLeft = (data: { socketId: string; name: string }) => {
      setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
      setSystemMsgHandlerState((fn: ((text: string) => void) | null) => {
        fn?.(`${data.name} left the session`);
        return fn;
      });
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('room-users', onRoomUsers);
    s.on('user-joined', onUserJoined);
    s.on('user-left', onUserLeft);

    s.connect();
    setSocket(s);

    return () => {
      s.emit('leave-room', sessionId);
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('room-users', onRoomUsers);
      s.off('user-joined', onUserJoined);
      s.off('user-left', onUserLeft);
      s.disconnect();
      setSocket(null);
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SessionSocketContext.Provider
      value={{
        socket,
        isConnected,
        participants,
        addSystemMessage: systemMsgHandler,
        setSystemMessageHandler,
      }}
    >
      {children}
    </SessionSocketContext.Provider>
  );
}

export function useSessionSocket() {
  return useContext(SessionSocketContext);
}
