'use client';

import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { io, Socket } from 'socket.io-client';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Phone,
  PhoneOff,
} from 'lucide-react';

interface VideoCallProps {
  sessionId: string;
  userId: string;
}

export default function VideoCall({ sessionId, userId }: VideoCallProps) {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>('');
  const [remotePeerId, setRemotePeerId] = useState<string>('');

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize PeerJS
    const PEER_HOST = process.env.NEXT_PUBLIC_PEER_HOST || 'localhost';
    const PEER_PORT = parseInt(process.env.NEXT_PUBLIC_PEER_PORT || '9000');

    const newPeer = new Peer({
      host: PEER_HOST,
      port: PEER_PORT,
      path: '/',
    });

    newPeer.on('open', (id) => {
      console.log('My peer ID:', id);
      setPeerId(id);
      // Notify others in the room about our peerId
      socketRef.current?.emit('join-room', { roomId: sessionId, peerId: id });
    });

    newPeer.on('call', (call) => {
      // Answer incoming call
      getUserMedia().then((stream) => {
        call.answer(stream);
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        call.on('stream', (remoteStream) => {
          remoteStreamRef.current = remoteStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setIsCallActive(true);
        });
      });
    });

    setPeer(newPeer);

    // Initialize Socket.io for signaling
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const socket = io(WS_URL);
    socketRef.current = socket;

    socket.on('user-joined', (data: { peerId: string }) => {
      console.log('User joined:', data.peerId);
      setRemotePeerId(data.peerId);
    });

    return () => {
      newPeer.destroy();
      socket.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sessionId]);

  const getUserMedia = async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio,
      });
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  const startCall = async () => {
    if (!peer || !remotePeerId) {
      alert('Waiting for other user to join...');
      return;
    }

    try {
      const stream = await getUserMedia(isVideoEnabled, isAudioEnabled);
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const call = peer.call(remotePeerId, stream);

      call.on('stream', (remoteStream) => {
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setIsCallActive(true);
      });
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to access camera/microphone');
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setIsCallActive(false);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      const stream = await getUserMedia(true, isAudioEnabled);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        // Add audio track from current stream
        if (localStreamRef.current) {
          const audioTrack = localStreamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            screenStream.addTrack(audioTrack);
          }
        }

        localStreamRef.current = screenStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    }
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            You
          </div>
        </div>

        {/* No Call Placeholder */}
        {!isCallActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <Video className="h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-400 mb-4">No active call</p>
            <button
              onClick={startCall}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Phone className="h-5 w-5" />
              <span>Start Call</span>
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Your Peer ID: {peerId || 'Connecting...'}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-colors ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            disabled={!isCallActive}
          >
            {isVideoEnabled ? (
              <Video className="h-5 w-5" />
            ) : (
              <VideoOff className="h-5 w-5" />
            )}
          </button>

          {/* Toggle Audio */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            disabled={!isCallActive}
          >
            {isAudioEnabled ? (
              <Mic className="h-5 w-5" />
            ) : (
              <MicOff className="h-5 w-5" />
            )}
          </button>

          {/* Toggle Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            disabled={!isCallActive}
          >
            {isScreenSharing ? (
              <MonitorOff className="h-5 w-5" />
            ) : (
              <Monitor className="h-5 w-5" />
            )}
          </button>

          {/* End Call */}
          {isCallActive && (
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
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
