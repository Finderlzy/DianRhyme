import * as THREE from 'three';
import { lerp, randomInRange } from '../utils/MathUtils';

export interface Bounds3 {
  x: number;
  y: number;
  z: number;
}

export const DEFAULT_PARTICLE_COUNT = 400;
export const MAX_PARTICLE_COUNT = 1000;

const COLOR_WARM_CREAM = new THREE.Color(0xffe9c8);
const COLOR_AMBER = new THREE.Color(0xffb36b);
const BASE_OPACITY = 0.65;
const OPACITY_AMPLITUDE = 0.12;
const BREATH_PERIOD_SECONDS = 4;

const PARTICLE_SIZE = 0.07;
const DEFAULT_VIEWPORT_HEIGHT = 1080;

// 与旧 CPU 版本同源的漂移幅度(±0.5 / 0.4 / 0.5)与角速度(0.4 / 0.3 / 0.25)
const DRIFT_X_AMPLITUDE = 0.5;
const DRIFT_Y_AMPLITUDE = 0.4;
const DRIFT_Z_AMPLITUDE = 0.5;

// 相位由 position 伪随机哈希生成,不新增 attribute;GLSL ES 1.00 语法
// 注意: position/normal/uv 由 three 前缀自动声明, 不得重复声明; color 需自行声明
const VERTEX_SHADER = /* glsl */ `
attribute vec3 color;

uniform float uTime;
uniform float uSize;
uniform float uViewportHeight;

varying vec3 vColor;

void main() {
  vec3 pos = position;
  float phase = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.28318;
  pos.x += sin(uTime * 0.4 + phase) * ${DRIFT_X_AMPLITUDE};
  pos.y += sin(uTime * 0.3 + phase * 1.7) * ${DRIFT_Y_AMPLITUDE};
  pos.z += cos(uTime * 0.25 + phase) * ${DRIFT_Z_AMPLITUDE};

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * uViewportHeight * 0.5 * projectionMatrix[1][1] / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
  vColor = color;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float alpha = smoothstep(0.5, 0.0, d) * uOpacity;
  gl_FragColor = vec4(vColor, alpha);
}
`;

export class Particles {
  static create(count: number, bounds: Bounds3): THREE.Points {
    const safeCount = Math.max(0, Math.min(Math.floor(count), MAX_PARTICLE_COUNT));
    const positions = new Float32Array(safeCount * 3);
    const colors = new Float32Array(safeCount * 3);
    for (let i = 0; i < safeCount; i++) {
      positions[i * 3] = randomInRange(-bounds.x, bounds.x);
      positions[i * 3 + 1] = randomInRange(-bounds.y, bounds.y);
      positions[i * 3 + 2] = randomInRange(-bounds.z, bounds.z);
      const t = Math.random();
      colors[i * 3] = lerp(COLOR_WARM_CREAM.r, COLOR_AMBER.r, t);
      colors[i * 3 + 1] = lerp(COLOR_WARM_CREAM.g, COLOR_AMBER.g, t);
      colors[i * 3 + 2] = lerp(COLOR_WARM_CREAM.b, COLOR_AMBER.b, t);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: BASE_OPACITY },
        uSize: { value: PARTICLE_SIZE },
        uViewportHeight: { value: DEFAULT_VIEWPORT_HEIGHT },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  static update(points: THREE.Points, deltaTime: number): void {
    const uniforms = (points.material as THREE.ShaderMaterial).uniforms;
    const t = (uniforms.uTime.value as number) + deltaTime;
    uniforms.uTime.value = t;
    uniforms.uOpacity.value =
      BASE_OPACITY + OPACITY_AMPLITUDE * Math.sin((t * Math.PI * 2) / BREATH_PERIOD_SECONDS);
  }

  static syncViewport(points: THREE.Points, viewportHeight: number): void {
    const uniforms = (points.material as THREE.ShaderMaterial).uniforms;
    uniforms.uViewportHeight.value = viewportHeight;
  }
}