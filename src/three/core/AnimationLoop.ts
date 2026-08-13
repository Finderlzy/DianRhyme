import * as THREE from 'three';

type RafId = ReturnType<typeof setTimeout> | number;

export class AnimationLoop {
  private running = false;
  private rafId: RafId | null = null;
  private readonly clock = new THREE.Clock();
  private callback: ((delta: number, elapsed: number) => void) | null = null;

  start(callback: (delta: number, elapsed: number) => void): void {
    this.callback = callback;
    if (this.running) return;
    this.running = true;

    const frame = () => {
      if (!this.running) return;
      const delta = this.clock.getDelta();
      const elapsed = this.clock.elapsedTime;
      this.callback?.(delta, elapsed);
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
