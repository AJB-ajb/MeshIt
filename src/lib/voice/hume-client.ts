/**
 * Hume AI EVI (Empathic Voice Interface) Client
 * Real-time voice conversation with emotion detection
 */

import { 
  HumeClient, 
  convertBlobToBase64, 
  getBrowserSupportedMimeType, 
  MimeType,
  EVIWebAudioPlayer,
  getAudioStream,
  ensureSingleValidAudioTrack,
} from 'hume';

export type HumeVoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export interface EmotionScore {
  name: string;
  score: number;
}

export interface HumeMessage {
  type: 'user_message' | 'assistant_message' | 'emotion' | 'error';
  content?: string;
  emotions?: EmotionScore[];
  timestamp: Date;
}

export interface HumeClientConfig {
  onStateChange?: (state: HumeVoiceState) => void;
  onMessage?: (message: HumeMessage) => void;
  onAudioLevel?: (level: number) => void;
  onError?: (error: Error) => void;
  systemPrompt?: string;
}

/**
 * Hume EVI Voice Client for real-time conversation
 */
export class HumeVoiceClient {
  private client: HumeClient | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private recorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private player: EVIWebAudioPlayer | null = null;
  private animationFrameId: number | null = null;
  
  private state: HumeVoiceState = 'idle';
  private config: HumeClientConfig;

  constructor(config: HumeClientConfig = {}) {
    this.config = config;
  }

  private setState(newState: HumeVoiceState) {
    this.state = newState;
    this.config.onStateChange?.(newState);
  }

  getState(): HumeVoiceState {
    return this.state;
  }

  /**
   * Connect to Hume EVI
   */
  async connect(apiKey: string, configId?: string): Promise<void> {
    if (this.socket) {
      console.warn('Already connected to Hume EVI');
      return;
    }

    try {
      this.setState('connecting');
      console.log('🎙️ Connecting to Hume EVI...');

      // Initialize Hume client
      this.client = new HumeClient({ apiKey });

      // Connect to EVI WebSocket
      this.socket = await this.client.empathicVoice.chat.connect({
        configId,
      });

      // Set up event handlers
      this.socket.on('open', () => this.handleOpen());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.on('message', (msg: any) => this.handleMessage(msg));
      this.socket.on('error', (err: Event | Error) => this.handleError(err));
      this.socket.on('close', () => this.handleClose());

      // Initialize audio player
      this.player = new EVIWebAudioPlayer();

    } catch (error) {
      console.error('❌ Hume EVI connection failed:', error);
      this.setState('idle');
      this.config.onError?.(error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  /**
   * Handle WebSocket open
   */
  private async handleOpen() {
    console.log('✅ Hume EVI connected');
    
    // Initialize audio player
    if (this.player) {
      await this.player.init();
    }
    
    await this.startAudioCapture();
    this.setState('listening');
  }

  /**
   * Handle incoming messages
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleMessage(msg: any) {
    switch (msg.type) {
      case 'audio_output':
        // Use EVIWebAudioPlayer for audio playback
        if (this.player) {
          this.setState('speaking');
          await this.player.enqueue(msg);
        }
        break;

      case 'user_message':
        // User's transcribed speech
        this.config.onMessage?.({
          type: 'user_message',
          content: msg.message?.content,
          timestamp: new Date(),
        });
        this.setState('thinking');
        break;

      case 'assistant_message':
        // Assistant's response text
        this.config.onMessage?.({
          type: 'assistant_message',
          content: msg.message?.content,
          timestamp: new Date(),
        });
        break;

      case 'assistant_end':
        // Assistant finished speaking
        this.setState('listening');
        break;

      case 'user_interruption':
        // User interrupted - stop playback
        this.player?.stop();
        this.setState('listening');
        break;

      case 'error':
        console.error('❌ Hume EVI error:', msg);
        this.config.onError?.(new Error(msg.message || 'Unknown EVI error'));
        break;

      default:
        // Handle emotion data if available in prosody
        if (msg.models?.prosody?.scores) {
          const emotions = Object.entries(msg.models.prosody.scores)
            .map(([name, score]) => ({ name, score: score as number }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
          this.config.onMessage?.({
            type: 'emotion',
            emotions,
            timestamp: new Date(),
          });
        }
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(err: Event | Error) {
    console.error('❌ Hume EVI WebSocket error:', err);
    this.config.onError?.(err instanceof Error ? err : new Error('WebSocket error'));
  }

  /**
   * Handle WebSocket close
   */
  private handleClose() {
    console.log('🔌 Hume EVI disconnected');
    this.cleanup();
    this.setState('idle');
  }

  /**
   * Start capturing audio from microphone
   */
  private async startAudioCapture(): Promise<void> {
    try {
      // Get supported MIME type
      const mimeTypeResult = getBrowserSupportedMimeType();
      const mimeType = mimeTypeResult.success ? mimeTypeResult.mimeType : MimeType.WEBM;

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up audio analysis for visualization
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);

      // Start monitoring audio levels
      this.monitorAudioLevel();

      // Create MediaRecorder
      this.recorder = new MediaRecorder(stream, { mimeType });
      
      this.recorder.ondataavailable = async (event: BlobEvent) => {
        if (event.data.size > 0 && this.socket) {
          const base64Data = await convertBlobToBase64(event.data);
          this.socket.sendAudioInput({ data: base64Data });
        }
      };

      this.recorder.onerror = (e) => {
        console.error('❌ MediaRecorder error:', e);
      };

      // Start recording with small time slices for real-time streaming
      this.recorder.start(80); // 80ms chunks
      console.log('🎤 Audio capture started');

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error);
      throw error;
    }
  }

  /**
   * Monitor audio level for visualization
   */
  private monitorAudioLevel() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (!this.analyser || this.state === 'idle') return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      this.config.onAudioLevel?.(average);

      this.animationFrameId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  /**
   * Disconnect from Hume EVI
   */
  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  private cleanup() {
    // Stop animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Stop recorder
    if (this.recorder) {
      if (this.recorder.state === 'recording') {
        this.recorder.stop();
      }
      this.recorder.stream.getTracks().forEach((track) => track.stop());
      this.recorder = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Dispose audio player
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }

    // Clear socket
    this.socket = null;
    this.client = null;
  }
}

/**
 * Create a Hume voice client instance
 */
export function createHumeVoiceClient(config: HumeClientConfig = {}): HumeVoiceClient {
  return new HumeVoiceClient(config);
}
