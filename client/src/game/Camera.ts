import Phaser from 'phaser';
import { CAMERA_ZOOM, CAMERA_LERP } from '../config';

/**
 * Camera — wraps Phaser's main camera with:
 * - follow player with lerp
 * - zoom in/out with scroll wheel or +/- keys
 * - pixel-perfect clamping to prevent sub-pixel rendering
 */
export class Camera {
  private cam: Phaser.Cameras.Scene2D.Camera;
  private currentZoom: number;
  private readonly minZoom = 0.5;
  private readonly maxZoom = 4;
  private readonly zoomStep = 0.5;
  private zoomKeys: {
    zoomIn: Phaser.Input.Keyboard.Key;
    zoomOut: Phaser.Input.Keyboard.Key;
  } | null = null;

  constructor(scene: Phaser.Scene) {
    this.cam = scene.cameras.main;
    this.currentZoom = CAMERA_ZOOM;
    this.cam.setZoom(this.currentZoom);
    this.setupScrollZoom(scene);
    this.setupKeyZoom(scene);
  }

  // ── Follow ────────────────────────────────────────────────────────────────────

  follow(
    target: Phaser.GameObjects.GameObject,
    worldWidth: number,
    worldHeight: number,
  ): void {
    this.cam.startFollow(target, true, CAMERA_LERP, CAMERA_LERP);
    this.cam.setBounds(0, 0, worldWidth, worldHeight);
    this.cam.setRoundPixels(true); // pixel-perfect
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────────

  private setupScrollZoom(scene: Phaser.Scene): void {
    scene.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown,
        _deltaX: number,
        deltaY: number,
      ) => {
        if (deltaY > 0) {
          this.zoomOut();
        } else {
          this.zoomIn();
        }
      },
    );
  }

  private setupKeyZoom(scene: Phaser.Scene): void {
    if (!scene.input.keyboard) return;

    this.zoomKeys = {
      zoomIn: scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.PLUS,
      ),
      zoomOut: scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.MINUS,
      ),
    };
  }

  update(): void {
    if (!this.zoomKeys) return;
    if (Phaser.Input.Keyboard.JustDown(this.zoomKeys.zoomIn)) {
      this.zoomIn();
    }
    if (Phaser.Input.Keyboard.JustDown(this.zoomKeys.zoomOut)) {
      this.zoomOut();
    }
  }

  private zoomIn(): void {
    this.currentZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
    this.applyZoom();
  }

  private zoomOut(): void {
    this.currentZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
    this.applyZoom();
  }

  private applyZoom(): void {
    this.cam.setZoom(this.currentZoom);
  }

  // ── Getters ──────────────────────────────────────────────────────────────────

  getZoom(): number {
    return this.currentZoom;
  }

  getCamera(): Phaser.Cameras.Scene2D.Camera {
    return this.cam;
  }

  /** Convert screen coords to world coords */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx + this.cam.scrollX) / this.currentZoom,
      y: (sy + this.cam.scrollY) / this.currentZoom,
    };
  }

  shake(duration = 200, intensity = 0.005): void {
    this.cam.shake(duration, intensity);
  }

  flash(duration = 300): void {
    this.cam.flash(duration, 255, 255, 255, true);
  }

  fadeIn(duration = 500): void {
    this.cam.fadeIn(duration, 0, 0, 0);
  }

  fadeOut(duration = 500, callback?: () => void): void {
    this.cam.fadeOut(duration, 0, 0, 0);
    if (callback) {
      this.cam.once('camerafadeoutcomplete', callback);
    }
  }
}
