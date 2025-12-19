import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket(
  userId: string | null,
  onNotification: (msg: string) => void
) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', userId);
    });

    socket.on('taskUpdate', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('taskDeleted', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    socket.on('assignmentNotification', (task: { title: string }) => {
      onNotification(`New task assigned: ${task.title}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, queryClient, onNotification]);
}
