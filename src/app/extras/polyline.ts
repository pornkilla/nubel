import {
  Geometry,
  Program,
  Mesh,
  Vec2,
  Vec3,
  Color,
  OGLRenderingContext,
} from 'ogl-typescript';

const defaultVertex = /* glsl */ `
  precision highp float;

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

const defaultFragment = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;

  varying vec2 vUv;

  void main() {
    gl_FragColor.rgb = uColor;
    gl_FragColor.a = 1.0;
  }
`;

export interface PolylineOptions {
  points?: Vec3[];
  vertex?: string;
  fragment?: string;
  thickness?: number;
  color?: Color;
}

const tmp = new Vec3(); 

export default class Polyline extends Mesh {
  public points: Vec3[];
  private resolution: { value: Vec3 } | null = null;
  private dpr: { value: number } | null = null;
  private thickness: { value: number } | null = null;
  private color: { value: Color } | null = null;

  constructor(
    gl: OGLRenderingContext,
    {
      points = [],
      vertex = defaultVertex,
      thickness = 1.0,
      color = new Color('#000'),
    }: PolylineOptions = {}
  ) {
   const count = points.length;
    if (count === 0) throw new Error('Polyline requires at least one point');

    // Подготовка буферов (без this!)
    const position = new Float32Array(count * 3 * 2);
    const prev = new Float32Array(count * 3 * 2);
    const next = new Float32Array(count * 3 * 2);
    const side = new Float32Array(count * 1 * 2);
    const uv = new Float32Array(count * 2 * 2);
    const index = new Uint16Array((count - 1) * 3 * 2);

    for (let i = 0; i < count; i++) {
      side.set([-1, 1], i * 2);
      const v = i / (count - 1);
      uv.set([0, v, 1, v], i * 4);
      if (i === count - 1) continue;
      const ind = i * 2;
      index.set([ind + 0, ind + 1, ind + 2], (ind + 0) * 3);
      index.set([ind + 2, ind + 1, ind + 3], (ind + 1) * 3);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: position },
      prev: { size: 3, data: prev },
      next: { size: 3, data: next },
      side: { size: 1, data: side },
      uv: { size: 2, data: uv },
      index: { size: 1, data: index },
    });

    const uniforms: any = {
      uColor: { value: color },
      uThickness: { value: thickness },
      uResolution: { value: new Vec2(gl.canvas.width, gl.canvas.height) },
      uDPR: { value: gl.renderer.dpr },
    };

    const program = new Program(gl, {
      vertex,
      fragment: defaultFragment,
      uniforms,
    });

    super(gl, { geometry, program });

    this.points = points;
    this.resolution = uniforms.uResolution;
    this.dpr = uniforms.uDPR;
    this.thickness = uniforms.uThickness;
    this.color = uniforms.uColor;

    this.updateGeometry();
    this.resize();
  }

updateGeometry() {
    const { points } = this;
    const { position, prev, next } = this.geometry.attributes;

    const posData = position.data as Float32Array;
    const prevData = prev.data as Float32Array;
    const nextData = next.data as Float32Array;

    points.forEach((p, i) => {
      // position: две копии точки
      p.toArray(posData, i * 3 * 2);
      p.toArray(posData, i * 3 * 2 + 3);

      if (i === 0) {
        // prev для первой точки
        tmp.copy(p).sub(points[i + 1] || p).add(p);
        tmp.toArray(prevData, i * 3 * 2);
        tmp.toArray(prevData, i * 3 * 2 + 3);
      } else {
        p.toArray(prevData, (i - 1) * 3 * 2);
        p.toArray(prevData, (i - 1) * 3 * 2 + 3);
      }

      if (i === points.length - 1) {
        // next для последней точки
        tmp.copy(p).sub(points[i - 1] || p).add(p);
        tmp.toArray(nextData, i * 3 * 2);
        tmp.toArray(nextData, i * 3 * 2 + 3);
      } else {
        p.toArray(nextData, (i + 1) * 3 * 2);
        p.toArray(nextData, (i + 1) * 3 * 2 + 3);
      }
    });

    position.needsUpdate = true;
    prev.needsUpdate = true;
    next.needsUpdate = true;
  }

  resize() {
    if (this.resolution) {
      this.resolution.value.set(window.innerWidth, window.innerHeight); // ✅ 2 аргумента
    }
    if (this.dpr) {
      this.dpr.value = window.devicePixelRatio;
    }
  }
}