/**
 * Voice Agent Performance Metrics
 * Track latency and performance metrics for real-time voice conversations
 */

export class VoiceMetrics {
  private startTime: number = 0;
  private metrics: {
    turnLatencies: number[];
    audioChunksReceived: number;
    audioChunksPlayed: number;
    errors: number;
    reconnections: number;
  } = {
    turnLatencies: [],
    audioChunksReceived: 0,
    audioChunksPlayed: 0,
    errors: 0,
    reconnections: 0,
  };

  /**
   * Start timing a conversation turn
   */
  startTurn() {
    this.startTime = Date.now();
  }

  /**
   * End timing a conversation turn and record latency
   */
  endTurn(): number {
    const latency = Date.now() - this.startTime;
    this.metrics.turnLatencies.push(latency);
    console.log(`Turn latency: ${latency}ms`);
    return latency;
  }

  /**
   * Record audio chunk received
   */
  recordAudioChunkReceived() {
    this.metrics.audioChunksReceived++;
  }

  /**
   * Record audio chunk played
   */
  recordAudioChunkPlayed() {
    this.metrics.audioChunksPlayed++;
  }

  /**
   * Record an error
   */
  recordError() {
    this.metrics.errors++;
  }

  /**
   * Record a reconnection attempt
   */
  recordReconnection() {
    this.metrics.reconnections++;
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.metrics.turnLatencies.length === 0) return 0;
    const sum = this.metrics.turnLatencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.metrics.turnLatencies.length);
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    return {
      averageLatency: this.getAverageLatency(),
      minLatency: Math.min(...this.metrics.turnLatencies, 0),
      maxLatency: Math.max(...this.metrics.turnLatencies, 0),
      totalTurns: this.metrics.turnLatencies.length,
      audioChunksReceived: this.metrics.audioChunksReceived,
      audioChunksPlayed: this.metrics.audioChunksPlayed,
      errors: this.metrics.errors,
      reconnections: this.metrics.reconnections,
    };
  }

  /**
   * Log metrics summary to console
   */
  logSummary() {
    const summary = this.getSummary();
    console.log('=== Voice Agent Metrics ===');
    console.log(`Average Latency: ${summary.averageLatency}ms`);
    console.log(`Min Latency: ${summary.minLatency}ms`);
    console.log(`Max Latency: ${summary.maxLatency}ms`);
    console.log(`Total Turns: ${summary.totalTurns}`);
    console.log(`Audio Chunks: ${summary.audioChunksReceived} received, ${summary.audioChunksPlayed} played`);
    console.log(`Errors: ${summary.errors}`);
    console.log(`Reconnections: ${summary.reconnections}`);
    console.log('==========================');
  }
}

/**
 * Global metrics instance
 */
export const voiceMetrics = new VoiceMetrics();
