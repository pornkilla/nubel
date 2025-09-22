import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { Renderer as OGLRenderer, Transform, Vec3, Color } from 'ogl-typescript';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Polyline, { vertex } from "./extras/polyline";

  @Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  private oglRenderer!: OGLRenderer;
  private scene!: Transform;
  private mouse = new Vec3();
  private lines: Array<{
    spring: number;
    friction: number;
    mouseVelocity: Vec3;
    mouseOffset: Vec3;
    points: Vec3[];
    polyline: Polyline;
  }> = [];
  private animationId: number | null = null;

  constructor(private renderer2: Renderer2) {}

  ngAfterViewInit() {
    this.initWebGL();
    this.addEventListeners();
    this.animate();
  }

  private initWebGL() {
    const canvas = this.canvasRef.nativeElement;
    this.oglRenderer = new OGLRenderer({
        canvas,
        dpr: 2,
        alpha: true,
        autoClear: false,
      });

    this.oglRenderer.gl.clearColor(0, 0, 0, 0);
    this.scene = new Transform();

    const lineColor = '#ff52c5';
    const numPoints = 25;
    const initialPoints = Array(numPoints).fill(0).map(() => new Vec3(0, 0, 0));
    const line = {
      spring: 3,
      friction: 0.1,
      mouseVelocity: new Vec3(),
      mouseOffset: new Vec3(0.01),
      points: [...initialPoints],
      polyline: new Polyline(this.oglRenderer, {
        points: [...initialPoints],
        thickness: 1,
        color: new Color(lineColor),
      }),
    };

    line.polyline.setParent(this.scene);
    this.lines.push(line);

    this.resize();
  }

  private addEventListeners() {
    const mouseHandler = this.updateMouse.bind(this);
    const resizeHandler = () => this.resize();

    if ('ontouchstart' in window) {
      this.renderer2.listen('window', 'touchstart', mouseHandler);
      this.renderer2.listen('window', 'touchmove', mouseHandler);
    } else {
      this.renderer2.listen('window', 'mousemove', mouseHandler);
    }

    this.renderer2.listen('window', 'resize', resizeHandler);
  }

  private updateMouse(e: MouseEvent | TouchEvent) {
    let x: number, y: number;

    if ('changedTouches' in e && e.changedTouches.length > 0) {
      x = e.changedTouches[0].pageX;
      y = e.changedTouches[0].pageY;
    } else if ('pageX' in e) {
      x = e.pageX;
      y = e.pageY;
    } else {
      return;
    }

    this.mouse.set(
      (x / this.oglRenderer.width) * 2 - 1,
      (y / this.oglRenderer.height) * -2 + 1,
      0
    );
  }

  private resize() {
    this.oglRenderer.setSize(window.innerWidth, window.innerHeight);
    this.lines.forEach((line) => line.polyline.resize());
  }

  private animate = () => {
    this.update();
    this.animationId = requestAnimationFrame(this.animate);
  };

  private update() {
    const tmp = new Vec3();

    this.lines.forEach((line) => {
      for (let i = line.points.length - 1; i >= 0; i--) {
        if (i === 0) {
          tmp.copy(this.mouse)
             .add(line.mouseOffset)
             .sub(line.points[i])
             .multiply(line.spring);
          line.mouseVelocity.add(tmp).multiply(line.friction);
          line.points[i].add(line.mouseVelocity);
        } else {
          line.points[i].lerp(line.points[i - 1], 0.5);
        }
      }
      line.polyline.updateGeometry();
    });

    this.oglRenderer.render({ scene: this.scene });
  }

  ngOnDestroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}
