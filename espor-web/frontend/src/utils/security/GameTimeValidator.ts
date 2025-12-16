export class GameTimeValidator {
  private startTime: number = 0;
  private lastUpdate: number = 0;
  private pausedTime: number = 0;
  private pauseStart: number = 0;
  private isPaused: boolean = false;
  private suspiciousPauses: number = 0;
  private onSuspicious: (reason: string) => void;

  constructor(onSuspicious: (reason: string) => void) {
    this.onSuspicious = onSuspicious;
    this.setupVisibilityDetection();
    this.setupPageBlurDetection();
  }

  start() {
    this.startTime = Date.now();
    this.lastUpdate = this.startTime;
    this.pausedTime = 0;
    this.suspiciousPauses = 0;
  }

  update() {
    const now = Date.now();
    
    const timeSinceLastUpdate = now - this.lastUpdate;
    if (timeSinceLastUpdate > 5000 && !this.isPaused) {
      this.onSuspicious('time_jump_detected');
    }

    if (this.suspiciousPauses > 3) {
      this.onSuspicious('excessive_pauses');
    }

    this.lastUpdate = now;
  }

  getElapsedTime(): number {
    if (this.isPaused) {
      return this.pauseStart - this.startTime - this.pausedTime;
    }
    return Date.now() - this.startTime - this.pausedTime;
  }

  private setupVisibilityDetection() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePause();
      } else {
        this.handleResume();
      }
    });
  }

  private setupPageBlurDetection() {
    window.addEventListener('blur', () => {
      this.handlePause();
    });

    window.addEventListener('focus', () => {
      this.handleResume();
    });
  }

  private handlePause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pauseStart = Date.now();
    }
  }

  private handleResume() {
    if (this.isPaused) {
      const pauseDuration = Date.now() - this.pauseStart;
      
      if (pauseDuration > 10000) {
        this.suspiciousPauses++;
        this.onSuspicious('long_pause_detected');
      }
      
      this.pausedTime += pauseDuration;
      this.isPaused = false;
    }
  }
}

