import { InputState, Vector2 } from '../../types/game';
import { INPUT_KEYS } from '../utils/Constants';

export class InputSystem {
  private inputState: InputState;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      mousePosition: { x: 0, y: 0 },
      mouseDown: false,
      keys: new Set<string>(),
    };
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    if (this.canvas) {
      this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    // Touch events for mobile
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
      this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    this.inputState.keys.add(key);

    if (INPUT_KEYS.FORWARD.includes(key)) {
      this.inputState.forward = true;
    }
    if (INPUT_KEYS.BACKWARD.includes(key)) {
      this.inputState.backward = true;
    }
    if (INPUT_KEYS.LEFT.includes(key)) {
      this.inputState.left = true;
    }
    if (INPUT_KEYS.RIGHT.includes(key)) {
      this.inputState.right = true;
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key;
    this.inputState.keys.delete(key);

    if (INPUT_KEYS.FORWARD.includes(key)) {
      this.inputState.forward = false;
    }
    if (INPUT_KEYS.BACKWARD.includes(key)) {
      this.inputState.backward = false;
    }
    if (INPUT_KEYS.LEFT.includes(key)) {
      this.inputState.left = false;
    }
    if (INPUT_KEYS.RIGHT.includes(key)) {
      this.inputState.right = false;
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.canvas) return;
    
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private handleMouseDown(event: MouseEvent): void {
    this.inputState.mouseDown = true;
  }

  private handleMouseUp(event: MouseEvent): void {
    this.inputState.mouseDown = false;
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0 && this.canvas) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mousePosition = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      this.inputState.mouseDown = true;
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0 && this.canvas) {
      const touch = event.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.inputState.mousePosition = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.inputState.mouseDown = false;
  }

  getInputState(): InputState {
    return this.inputState;
  }

  isKeyPressed(key: string): boolean {
    return this.inputState.keys.has(key);
  }

  getMovementVector(): Vector2 {
    const movement: Vector2 = { x: 0, y: 0 };

    // Fixed: W (forward) should move up (negative y), S (backward) should move down (positive y)
    if (this.inputState.forward) movement.y -= 1;
    if (this.inputState.backward) movement.y += 1;
    if (this.inputState.left) movement.x -= 1;
    if (this.inputState.right) movement.x += 1;

    // Normalize diagonal movement
    const length = Math.sqrt(movement.x * movement.x + movement.y * movement.y);
    if (length > 0) {
      movement.x /= length;
      movement.y /= length;
    }

    return movement;
  }

  reset(): void {
    this.inputState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      mousePosition: { x: 0, y: 0 },
      mouseDown: false,
      keys: new Set<string>(),
    };
  }

  destroy(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));

    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
  }
}
