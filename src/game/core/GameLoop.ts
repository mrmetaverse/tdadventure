export class GameLoop {
  private lastTime: number = 0;
  private deltaTime: number = 0;
  private updateCallback: (deltaTime: number) => void;
  private renderCallback: () => void;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  constructor(
    updateCallback: (deltaTime: number) => void,
    renderCallback: () => void
  ) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
    this.lastTime = currentTime;

    this.updateCallback(this.deltaTime);
    this.renderCallback();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  getDeltaTime(): number {
    return this.deltaTime;
  }
}
