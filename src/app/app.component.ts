import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, ViewChild, OnDestroy, Renderer2, HostListener, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Vec3, Polyline, Renderer, Transform, Color } from 'ogl-typescript';

const CONFIG = {
  dpr: 2,
  lineColor: '#ff52c5',
  spring: 3,
  numPoints: 10,
  friction: 0.1,
  thickness: 2,
  lerp: 0.9,
}

interface LineData {
  spring: number;
  friction: number;
  mouseVelocity: Vec3;
  mouseOffset: Vec3;
  points: Vec3[];
  polyline: Polyline | null;
}
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
  ],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private renderer: Renderer | null = null;
  private scene: Transform | null = null;
  private lines: LineData[] = [];
  private mouse: Vec3 | null = null;
  private tmp: Vec3 | null = null;
  private animationFrameId: number = 0;
  private isInitialized: boolean = false;

  isBrowser: boolean;
  private ogl: any;

  constructor(
    private renderer2: Renderer2,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: any) {
      this.isBrowser = isPlatformBrowser(this.platformId);
    }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const hideCanvCursor = localStorage.getItem('hideCanvCursor');
    const shouldHideCursor = hideCanvCursor ? JSON.parse(hideCanvCursor) : false;
    
    if (!this.isTouchDevice() && !shouldHideCursor) {
      this.loadAndInitCanvas();
    } else {
      this.canvasRef.nativeElement.style.display = 'none';
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.lines.forEach((line) => line.polyline?.resize());
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.updateMouse(event);
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('touchmove', ['$event'])
  onTouchEvent(event: TouchEvent): void {
    this.updateMouse(event);
  }

  private isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private loadAndInitCanvas(): void {
    try {
      this.initCanvas();
    } catch(error) {
      console.error('Failed to init OGL:', error);
    }
  }

  private initCanvas(): void {
    if (this.isInitialized) return;

    this.ngZone.runOutsideAngular(() => {
      try {
        this.setupRenderer();
        this.setupScene();
        this.createLines();
        this.startAnimation();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize canvas:', error);
      }
    });
  }

  private setupRenderer(): void {
    this.renderer = new Renderer({ dpr: CONFIG.dpr, alpha: true });

    const gl = this.renderer?.gl;
    const canvas = gl?.canvas as HTMLCanvasElement;

    canvas.id = 'pageCanvas';
    canvas.removeAttribute('width');
    canvas.removeAttribute('height');
    canvas.style.cssText = '';
    
    document.body.appendChild(canvas);
    this.renderer?.setSize(window.innerWidth, window.innerHeight);

    gl?.clearColor(0, 0, 0, 0);
  }

  private setupScene(): void {
    this.scene = new Transform();
  }

  private createLines(): void {
    const gl = this.renderer?.gl;

    if (!gl) {
      console.warn('WebGL context not available');
      return;
    }

    const vertex = `
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;
      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;
      
      vec4 getPosition() {
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1);
        vec2 nextScreen = next.xy * aspect;
        vec2 prevScreen = prev.xy * aspect;
        vec2 tangent = normalize(nextScreen - prevScreen);
        vec2 normal = vec2(-tangent.y, tangent.x);
        normal /= aspect;
        normal *= 1.0 - pow(abs(uv.y - 0.5) * 1.9, 2.0);
        float pixelWidth = 1.0 / (uResolution.y / uDPR);
        normal *= pixelWidth * uThickness;
        float dist = length(nextScreen - prevScreen);
        normal *= smoothstep(0.0, 0.02, dist);
        vec4 current = vec4(position, 1);
        current.xy -= normal * side;
        return current;
      }
      
      void main() {
        gl_Position = getPosition();
      }
    `;
    
    const line: LineData = {
      spring: CONFIG.spring,
      friction: CONFIG.friction,
      mouseVelocity: new Vec3(),
      mouseOffset: new Vec3(0.01),
      points: [],
      polyline: null
    };

    for (let i = 0; i < CONFIG.numPoints; i++) {
      line.points.push(new Vec3());
    }

    line.polyline = new Polyline(gl, {
      points: line.points,
      vertex,
      uniforms: {
        uColor: { value: new Color(CONFIG.lineColor) },
        uThickness: { value: CONFIG.thickness },
      },
    });

    line.polyline?.mesh.setParent(this.scene);
    this.lines.push(line);
    this.mouse = new Vec3();
    this.tmp = new Vec3();
  }

  private updateMouse(event: MouseEvent | TouchEvent): void {
    if (!this.mouse) return;

    const width = this.renderer?.gl.renderer.width || window.innerWidth;
    const height = this.renderer?.gl.renderer.height || window.innerHeight;

    let x: number;
    let y: number;

    if ('changedTouches' in event && event.changedTouches.length) {
      x = event.changedTouches[0].pageX;
      y = event.changedTouches[0].pageY;
    } else if ('pageX' in event) {
      x = event.pageX;
      y = event.pageY;
    } else {
      return;
    }

    this.mouse.set(
      (x / width) * 2 - 1,
      (y / height) * -2 + 1,
      0
    );
  }

  private startAnimation(): void {
    const update = (t: number): void => {
      this.animationFrameId = requestAnimationFrame(update);
      this.updateLines();
      if (this.renderer && this.scene) {
        this.renderer.render({ scene: this.scene });
      }
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private updateLines(): void {
    this.lines.forEach((line) => {
      for (let i = line.points.length - 1; i >= 0; i--) {
        if (i === 0) {
          this.tmp?.copy(this.mouse)
            .add(line.mouseOffset)
            .sub(line.points[i])
            .multiply(line.spring);
          
          line.mouseVelocity.add(this.tmp).multiply(line.friction);
          line.points[i].add(line.mouseVelocity);
        } else {
          line.points[i].lerp(line.points[i - 1], CONFIG.lerp);
        }
      }
      line.polyline?.updateGeometry();
    });
  }

  private cleanup(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.renderer?.gl?.canvas) {
      const canvas = this.renderer.gl.canvas as HTMLCanvasElement;
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }

    this.lines = [];
    this.isInitialized = false;
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
