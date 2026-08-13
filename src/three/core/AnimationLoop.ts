import * as THREE from 'three';

type RafId = ReturnType<typeof setTimeout> | number;

const MAX_DELTA = 0.05;

export class AnimationLoop {
  private running = false;
  private rafId: RafId | null = null;
  private readonly clock = new THREE.Clock();
  private elapsed = 0;
  private callback: ((delta: number, elapsed: number) => void) | null = null;
  private visibilityBound = false;
  private readonly onVisibilityHandler = () => {
    if (typeof document !== 'undefined' && document.hidden) {
      this.stop();
    } else {
      this.start(this.callback);
    }
  };

  start(callback: ((delta: number, elapsed: number) => void) | null): void {
    this.callback = callback;
    if (this.running) return;
    this.running = true;
    this.bindVisibility();

    // 丢弃 clock 累积的陈旧时间,保证恢复后的首帧 delta≈0
    this.clock.getDelta();

    const frame = () => {
      if (!this.running) return;
      const delta = Math.min(this.clock.getDelta(), MAX_DELTA);
      this.elapsed += delta;
      this.callback?.(delta, this.elapsed);
      this.rafId = this.schedule(frame);
    };

    this.rafId = this.schedule(frame);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      this.cancel(this.rafId);
      this.rafId = null;
    }
  }

  private bindVisibility(): void {
    if (this.visibilityBound) return;
    this.visibilityBound = true;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityHandler);
    }
  }

  private schedule(frame: () => void): RafId {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(frame);
    }
    return setTimeout(frame, 16);
  }

  private cancel(id: RafId): void {
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(id as number);
    } else if (typeof clearTimeout === 'function') {
      clearTimeout(id as ReturnType<typeof setTimeout>);
    }
  }
}
