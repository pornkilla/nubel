import {
  Geometry,
  Program,
  Mesh,
  Vec3,
  Color,
  Renderer,
  Vec2,
} from 'ogl-typescript';

export const vertex = `
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

      // When the points are on top of each other, shrink the line to avoid artifacts.
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

const fragment = `
  precision highp float;

  uniform vec3 uColor;

  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

export interface PolylineOptions {
  points?: Vec3[];
  vertexCount?: number;
  thickness?: number;
  color?: Color;
}

export default class Polyline extends Mesh {
  public points: Vec3[];

  constructor(
    renderer: Renderer, {
      points = [],
      vertexCount = 50,
      thickness = 1.0,
      color = new Color('#fff'),
    }: PolylineOptions = {}
  ) {
    const gl = renderer.gl;
    const numVertices = vertexCount;

    const positions = new Float32Array(numVertices * 3);
    const nexts = new Float32Array(numVertices * 3);
    const prevs = new Float32Array(numVertices * 3);
    const uvs = new Float32Array(numVertices * 2);
    const sides = new Float32Array(numVertices);

    for (let i = 0; i < numVertices; i++) {
      uvs[i * 2 + 0] = i / (numVertices - 1);
      uvs[i * 2 + 1] = i % 2;
      sides[i] = i % 2 ? 1 : -1;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      next: { size: 3, data: nexts },
      prev: { size: 3, data: prevs },
      uv: { size: 2, data: uvs },
      side: { size: 1, data: sides },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uColor: { value: color },
        uThickness: { value: thickness },
        uResolution: { value: new Vec2(window.innerWidth, window.innerHeight) },
        uDPR: { value: window.devicePixelRatio },
      },
    });

    super(gl, { geometry, program });

    this.points = points;

    this.updateGeometry();
  }

  updateGeometry() {
    const { geometry, points } = this;
    const { position, next, prev } = geometry.attributes;

    const positionData = position.data as Float32Array;
    const nextData = next.data as Float32Array;
    const prevData = prev.data as Float32Array;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const n = points[i + 1] || p;
      const m = points[i - 1] || p;

      positionData.set([p.x, p.y, p.z], i * 3);
      nextData.set([n.x, n.y, n.z], i * 3);
      prevData.set([m.x, m.y, m.z], i * 3);
    }

    position.needsUpdate = true;
    next.needsUpdate = true;
    prev.needsUpdate = true;
  }

  resize() {
    const uniforms = (this.program as Program).uniforms;
    uniforms['uResolution'].value.set(window.innerWidth, window.innerHeight);
    uniforms['uDPR'].value = window.devicePixelRatio;
  }
}