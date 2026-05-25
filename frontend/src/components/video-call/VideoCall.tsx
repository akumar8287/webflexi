'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSessionSocket } from '@/context/SessionSocketContext';
import { useAuthStore } from '@/lib/store';

interface VideoCallProps {
  sessionId: string;
  userId: string;
}

type CallState = 'idle' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export default function VideoCall({ sessionId, userId }: VideoCallProps) {
  const { socket, participants } = useSessionSocket();
  const { user } = useAuthStore();

  const [peerId, setPeerId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState('');

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const callRef = useRef<ReturnType<Peer['call']> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null); // always the camera stream

  const isCallActive = callState === 'connected';

  const stopAllTracks = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    cameraStreamRef.current = null;
  }, []);

  const attachLocalStream = useCallback((stream: MediaStream) => {
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }, []);

  const getCameraStream = useCallback(async (video = true, audio = true): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      return stream;
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError') throw new Error('Camera/microphone permission denied.');
      if (e.name === 'NotFoundError') throw new Error('No camera or microphone found.');
      throw new Error('Could not access media devices.');
    }
  }, []);

  const initPeer = useCallback(() => {
    const PEER_HOST = process.env.NEXT_PUBLIC_PEER_HOST || 'localhost';
    const PEER_PORT = parseInt(process.env.NEXT_PUBLIC_PEER_PORT || '9000');

    const peer = new Peer({
      host: PEER_HOST,
      port: PEER_PORT,
      path: '/',
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peer.on('open', (id) => {
      setPeerId(id);
      socket?.emit('join-room', {
        roomId: sessionId,
        userId: userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        peerId: id,
      });
    });

    peer.on('call', async (incomingCall) => {
      try {
        const stream = await getCameraStream(isVideoEnabled, isAudioEnabled);
        cameraStreamRef.current = stream;
        attachLocalStream(stream);

        incomingCall.answer(stream);
        callRef.current = incomingCall;
        setCallState('connecting');

        incomingCall.on('stream', (remoteStream) => {
          attachRemoteStream(remoteStream);
          setCallState('connected');
        });

        incomingCall.on('close', () => {
          setCallState('idle');
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });

        incomingCall.on('error', () => {
          setCallState('error');
          setError('Call connection lost.');
        });
      } catch (err: unknown) {
        toast.error((err as Error).message);
      }
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err.type, err.message);
      if (err.type === 'unavailable-id' || err.type === 'server-error') {
        setError('PeerJS server unavailable. Check that it is running on port 9000.');
        setCallState('error');
      } else if (err.type === 'peer-unavailable') {
        toast.error('Remote peer disconnected.');
        setCallState('idle');
      }
    });

    peer.on('disconnected', () => {
      setCallState((s) => (s === 'connected' ? 'reconnecting' : s));
      peer.reconnect();
    });

    peerRef.current = peer;
    return peer;
  }, [socket, sessionId, userId, user, isVideoEnabled, isAudioEnabled, getCameraStream, attachLocalStream, attachRemoteStream]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const peer = initPeer();

    return () => {
      stopAllTracks();
      peer.destroy();
      peerRef.current = null;
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // When remote user joins with a peerId, store it
  useEffect(() => {
    if (!socket) return;

    const onUserJoined = (data: { socketId: string; name: string; peerId?: string }) => {
      if (data.peerId && data.peerId !== peerId) {
        setRemotePeerId(data.peerId);
        setRemoteName(data.name);
      }
    };

    socket.on('user-joined', onUserJoined);
    return () => { socket.off('user-joined', onUserJoined); };
  }, [socket, peerId]);

  // Sync remote peer from participants list on mount
  useEffect(() => {
    const others = participants.filter((p) => p.userId !== userId && p.peerId);
    if (others.length > 0) {
      setRemotePeerId(others[0].peerId!);
      setRemoteName(others[0].name);
    }
  }, [participants, userId]);

  const startCall = async () => {
    if (!peerRef.current || !remotePeerId) {
      toast.error('Waiting for the other participant to join.');
      return;
    }
    setError('');
    setCallState('connecting');
    try {
      const stream = await getCameraStream(isVideoEnabled, isAudioEnabled);
      cameraStreamRef.current = stream;
      attachLocalStream(stream);

      const call = peerRef.current.call(remotePeerId, stream);
      callRef.current = call;

      call.on('stream', (remoteStream) => {
        attachRemoteStream(remoteStream);
        setCallState('connected');
      });

      call.on('close', () => {
        setCallState('idle');
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      });

      call.on('error', () => {
        setCallState('error');
        setError('Call failed. Try again.');
      });

      // Timeout if no stream after 15s
      setTimeout(() => {
        if (callState === 'connecting') {
          setCallState('error');
          setError('Could not connect. The other participant may not be ready.');
        }
      }, 15000);
    } catch (err: unknown) {
      setCallState('error');
      setError((err as Error).message);
    }
  };

  const endCall = () => {
    callRef.current?.close();
    callRef.current = null;
    stopAllTracks();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState('idle');
    setIsScreenSharing(false);
  };

  const toggleVideo = () => {
    const tracks = localStreamRef.current?.getVideoTracks();
    if (tracks?.length) {
      tracks[0].enabled = !tracks[0].enabled;
      setIsVideoEnabled(tracks[0].enabled);
    }
  };

  const toggleAudio = () => {
    const tracks = localStreamRef.current?.getAudioTracks();
    if (tracks?.length) {
      tracks[0].enabled = !tracks[0].enabled;
      setIsAudioEnabled(tracks[0].enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Restore camera
      try {
        const camStream = await getCameraStream(isVideoEnabled, isAudioEnabled);
        cameraStreamRef.current = camStream;

        if (callRef.current) {
          const senders = (callRef.current as unknown as { peerConnection: RTCPeerConnection })
            .peerConnection?.getSenders() ?? [];
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender) await videoSender.replaceTrack(camStream.getVideoTracks()[0]);
        }

        // Stop screen tracks
        localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
        attachLocalStream(camStream);
        setIsScreenSharing(false);
      } catch (err: unknown) {
        toast.error((err as Error).message);
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'monitor' } as MediaTrackConstraints,
          audio: false,
        });

        // Add audio from camera stream
        const audioTrack = cameraStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) screenStream.addTrack(audioTrack);

        if (callRef.current) {
          const senders = (callRef.current as unknown as { peerConnection: RTCPeerConnection })
            .peerConnection?.getSenders() ?? [];
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender) await videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
        }

        attachLocalStream(screenStream);
        setIsScreenSharing(true);

        // Auto stop when user clicks browser's "Stop sharing"
        screenStream.getVideoTracks()[0].onended = () => toggleScreenShare();
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== 'NotAllowedError') {
          toast.error('Could not start screen sharing.');
        }
      }
    }
  };

  const retryCall = () => {
    setError('');
    setCallState('idle');
    peerRef.current?.destroy();
    initPeer();
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative min-h-0">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />

        {/* Local Video PiP */}
        <div className="absolute bottom-4 right-4 w-36 h-28 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-600 z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isScreenSharing && (
            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
              Sharing
            </div>
          )}
          <div className="absolute bottom-1 left-1 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">
            You
          </div>
        </div>

        {/* Overlay states */}
        {!isCallActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 z-20">
            {callState === 'idle' && (
              <>
                <Video className="h-12 w-12 text-gray-600 mb-3" />
                {remoteName && (
                  <p className="text-gray-300 mb-1 font-medium">{remoteName} is in the room</p>
                )}
                <p className="text-gray-500 text-sm mb-4">
                  {remotePeerId ? 'Ready to call' : 'Waiting for participant…'}
                </p>
                <button
                  onClick={startCall}
                  disabled={!remotePeerId}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Start Call
                </button>
                <p className="text-xs text-gray-600 mt-3">
                  Peer ID: {peerId || 'Connecting…'}
                </p>
              </>
            )}

            {callState === 'connecting' && (
              <>
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-300">Connecting…</p>
              </>
            )}

            {callState === 'reconnecting' && (
              <>
                <RefreshCw className="h-10 w-10 text-yellow-500 animate-spin mb-3" />
                <p className="text-gray-300">Reconnecting…</p>
              </>
            )}

            {callState === 'error' && (
              <>
                <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-red-400 mb-1 text-sm text-center max-w-xs">{error}</p>
                <button
                  onClick={retryCall}
                  className="mt-3 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </>
            )}
          </div>
        )}

        {/* Connected — show remote name label */}
        {isCallActive && remoteName && (
          <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
            {remoteName}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 flex-shrink-0">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={toggleVideo}
            disabled={!isCallActive}
            className={`p-3 rounded-full transition-colors disabled:opacity-40 ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleAudio}
            disabled={!isCallActive}
            className={`p-3 rounded-full transition-colors disabled:opacity-40 ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          <button
            onClick={toggleScreenShare}
            disabled={!isCallActive}
            className={`p-3 rounded-full transition-colors disabled:opacity-40 ${
              isScreenSharing ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
          </button>

          {isCallActive && (
            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              title="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
