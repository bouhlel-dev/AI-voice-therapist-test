import { useState, useEffect, useRef } from "react";
import { FaRobot, FaMicrophone, FaStop, FaTimes } from 'react-icons/fa';

// Inline Styles
const styles = {
  chatWindow: {
    position: 'fixed',
    bottom: '80px',
    right: '24px',
    width: '384px',
    background: 'white',
    boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
  },
  header: {
    background: 'linear-gradient(to right, #3B82F6, #9333EA)',
    color: 'white',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '50%',
    padding: '4px',
    cursor: 'pointer',
    color: 'white',
  },
  messagesContainer: {
    height: '320px',
    overflowY: 'auto',
    padding: '16px',
    background: '#F9FAFB',
  },
  userMessage: {
    background: 'linear-gradient(to right, #3B82F6, #2563EB)',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '16px',
    borderTopRightRadius: '4px',
    marginLeft: 'auto',
    maxWidth: '80%',
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  botMessage: {
    background: 'linear-gradient(to right, #F3E8FF, #FAF5FF)',
    color: '#1F2937',
    padding: '12px 16px',
    borderRadius: '16px',
    borderTopLeftRadius: '4px',
    maxWidth: '80%',
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  button: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  startButton: {
    background: 'linear-gradient(to right, #10B981, #059669)',
    color: 'white',
  },
  stopButton: {
    background: 'linear-gradient(to right, #EF4444, #DC2626)',
    color: 'white',
  },
};

// Visual Waveform Animation Component
function WaveformAnimation({ isActive, type = 'listening' }) {
  const bars = type === 'speaking' ? 5 : 3;
  const bgColor = type === 'listening' ? '#10B981' : type === 'speaking' ? '#3B82F6' : '#F59E0B';
  
  return (
    <>
      <style>
        {`
          @keyframes wave {
            0%, 100% { height: 8px; }
            50% { height: 48px; }
          }
          .animate-wave {
            animation: wave 1.2s ease-in-out infinite;
          }
        `}
      </style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '64px' }}>
        {[...Array(bars)].map((_, i) => (
          <div
            key={i}
            className={isActive ? 'animate-wave' : ''}
            style={{
              width: '8px',
              height: isActive ? '8px' : '8px',
              borderRadius: '4px',
              backgroundColor: bgColor,
              animationDelay: `${i * 0.1}s`,
              animationDuration: type === 'speaking' ? '0.8s' : '1.2s',
            }}
          />
        ))}
      </div>
    </>
  );
}

// Processing Spinner Component
function ProcessingSpinner() {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
        <div style={{ position: 'relative' }}>
          <div className="animate-spin" style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '4px solid #FEF3C7',
            borderTopColor: '#F59E0B',
          }}></div>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24px',
            height: '24px',
            backgroundColor: '#F59E0B',
            borderRadius: '50%',
          }} className="animate-pulse"></div>
        </div>
      </div>
    </>
  );
}

// Microphone Icon with Pulse
function MicrophoneIndicator() {
  return (
    <>
      <style>
        {`
          @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
          }
          .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}
      </style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '64px' }}>
        <div style={{ position: 'relative' }}>
          <div className="animate-ping" style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#10B981',
            borderRadius: '50%',
            opacity: 0.2,
          }}></div>
          <div style={{
            position: 'relative',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '16px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FaMicrophone size={24} />
          </div>
        </div>
      </div>
    </>
  );
}

// Chat Window Component with Voice Activity Detection
function ChatWindow({ onClose, messages, setMessages }) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('idle');
  const [volume, setVolume] = useState(0);
  const [currentAudio, setCurrentAudio] = useState(null);
  
  const websocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Connect to WebSocket
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/audio');
      websocketRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ Connected to server');
        setStatus('listening');
      };
      
      ws.onmessage = async (event) => {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          handleServerMessage(data);
        } else {
          // Received audio response
          const audioBlob = new Blob([event.data], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          setStatus('speaking');
          setCurrentAudio(audio);
          
          await audio.play();
          
          audio.onended = () => {
            setStatus('listening');
            setCurrentAudio(null);
          };
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
      };
      
      ws.onclose = () => {
        console.log('❌ Disconnected from server');
        stopRecording();
      };
      
      // Setup audio recording
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      processor.onaudioprocess = (e) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const int16Data = float32ToInt16(inputData);
          ws.send(int16Data);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Error accessing microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }

    // Close WebSocket
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setStatus('idle');
    setVolume(0);
  };

  const handleServerMessage = (data) => {
    switch(data.status) {
      case 'listening':
        setStatus('listening');
        setVolume(Math.min((data.volume / 1000) * 100, 100));
        break;
      case 'processing':
        setStatus('processing');
        break;
      case 'response':
        setMessages(prev => [...prev, {
          user: data.message,
          bot: data.response
        }]);
        break;
      case 'ready':
        setStatus('listening');
        break;
      case 'idle':
        setVolume(Math.min((data.volume / 1000) * 100, 100));
        break;
      case 'error':
        setStatus('error');
        console.error('Server error:', data.message);
        break;
    }
  };

  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array.buffer;
  };

  const getStatusText = () => {
    switch(status) {
      case 'listening': return 'Listening to you...';
      case 'processing': return 'Thinking...';
      case 'speaking': return 'AI is speaking...';
      case 'error': return 'Connection Error';
      default: return 'Ready to start';
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'listening': return 'linear-gradient(to right, #10B981, #059669)';
      case 'processing': return 'linear-gradient(to right, #F59E0B, #D97706)';
      case 'speaking': return 'linear-gradient(to right, #3B82F6, #2563EB)';
      case 'error': return 'linear-gradient(to right, #EF4444, #DC2626)';
      default: return 'linear-gradient(to right, #9CA3AF, #6B7280)';
    }
  };

  return (
    <div style={styles.chatWindow}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaRobot size={24} />
          <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>AI Therapist</h3>
        </div>
        <button onClick={onClose} style={styles.closeBtn}>
          <FaTimes size={20} />
        </button>
      </div>

      {/* Visual Status Indicator */}
      <div style={{ background: getStatusColor(), color: 'white', padding: '16px 0' }}>
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          {getStatusText()}
        </div>
        
        {/* Different animations based on status */}
        {status === 'listening' && volume > 30 && (
          <WaveformAnimation isActive={true} type="listening" />
        )}
        {status === 'listening' && volume <= 30 && (
          <MicrophoneIndicator />
        )}
        {status === 'processing' && (
          <ProcessingSpinner />
        )}
        {status === 'speaking' && (
          <WaveformAnimation isActive={true} type="speaking" />
        )}
        {(status === 'idle' || status === 'error') && (
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '32px' }}>🎙️</div>
          </div>
        )}
      </div>

      {/* Volume Meter */}
      {isRecording && status === 'listening' && (
        <div style={{ padding: '8px 16px', background: '#F9FAFB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#4B5563' }}>Volume:</span>
            <div style={{ flex: 1, height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(to right, #34D399, #10B981)',
                width: `${volume}%`,
                transition: 'width 0.1s',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: '#4B5563', width: '32px' }}>{Math.round(volume)}%</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '80px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎤</div>
            <p style={{ fontWeight: '600', margin: '0 0 8px 0' }}>Click the microphone to start</p>
            <p style={{ fontSize: '14px', margin: 0 }}>Speak naturally, pauses are detected automatically</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <div style={styles.userMessage}>
                  <p style={{ fontSize: '12px', opacity: 0.75, margin: '0 0 4px 0' }}>You</p>
                  <p style={{ margin: 0 }}>{msg.user}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={styles.botMessage}>
                  <p style={{ fontSize: '12px', color: '#9333EA', fontWeight: '600', margin: '0 0 4px 0' }}>AI Therapist</p>
                  <p style={{ margin: 0 }}>{msg.bot}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div style={{ padding: '16px', borderTop: '1px solid #E5E7EB', background: 'white' }}>
        {!isRecording ? (
          <button onClick={startRecording} style={{ ...styles.button, ...styles.startButton }}>
            <FaMicrophone size={20} />
            Start Listening
          </button>
        ) : (
          <button onClick={stopRecording} style={{ ...styles.button, ...styles.stopButton }}>
            <FaStop size={20} />
            Stop Recording
          </button>
        )}
        <p style={{ fontSize: '12px', color: '#6B7280', textAlign: 'center', marginTop: '8px', marginBottom: 0 }}>
          {isRecording ? 'Voice activity detection active' : 'Powered by AI voice recognition'}
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;