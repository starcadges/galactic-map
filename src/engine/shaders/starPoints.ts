import * as THREE from 'three';

// Point stars with inverse-square brightness. Flux beyond what one pixel can
// hold spreads into a larger, softer disc (and eventually bloom), so a star
// looks right from 0.1 ly or 1,000 ly without special cases.

export const STAR_POINT_VERT = /* glsl */ `
attribute vec3 color;
attribute float lum;
attribute float phase;
uniform float uK;
uniform float uDpr;
uniform float uTime;
uniform float uFade;
uniform vec3 uFocus;      // local-space point the field is centred on
uniform float uRadius;    // fade-out radius around uFocus (0 = none)
uniform float uNearHide;  // hide stars closer than this to the camera
uniform float uHideR;     // hide stars within this distance of uHideAt (the active system)
uniform vec3 uHideAt;
varying vec3 vColor;
varying float vPeak;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float d = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  float F = uK * lum / max(d * d, 1e-10);
  F = F / (1.0 + F * 0.02);
  F *= 1.0 + 0.1 * sin(uTime * (0.8 + fract(phase) * 2.5) + phase * 7.0);
  if (uRadius > 0.0) {
    float r = length(position - uFocus);
    F *= 1.0 - smoothstep(uRadius * 0.55, uRadius, r);
  }
  if (uHideR > 0.0) F *= smoothstep(uHideR * 0.6, uHideR, length(position - uHideAt));
  F *= smoothstep(uNearHide * 0.5, uNearHide, d) * uFade;
  float base = 1.25 * uDpr;
  float s = min(base * (1.0 + 0.55 * sqrt(F)), 9.0 * uDpr);
  gl_PointSize = s;
  vPeak = F / ((s / base) * (s / base));
  vColor = color;
  if (vPeak < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

export const STAR_POINT_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vPeak;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 5.5) + 0.05 * (1.0 - r2);
  gl_FragColor = vec4(vColor * vPeak * a, 1.0);
}`;

export function makeStarPointMaterial(k: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: STAR_POINT_VERT,
    fragmentShader: STAR_POINT_FRAG,
    uniforms: {
      uK: { value: k },
      uDpr: { value: 1 },
      uTime: { value: 0 },
      uFade: { value: 1 },
      uFocus: { value: new THREE.Vector3() },
      uRadius: { value: 0 },
      uNearHide: { value: 0 },
      uHideR: { value: 0 },
      uHideAt: { value: new THREE.Vector3() },
    },
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

const lin = (c: number) => Math.pow(Math.max(0, c), 2.2);
import { kelvinToRgb } from '../../world/galaxyModel';
export function starColorLinear(k: number, out: Float32Array, i: number, sat = 1.12) {
  const [r, g, b] = kelvinToRgb(k);
  const l = 0.3 * r + 0.55 * g + 0.15 * b;
  out[i * 3] = lin(l + (r - l) * sat);
  out[i * 3 + 1] = lin(l + (g - l) * sat);
  out[i * 3 + 2] = lin(l + (b - l) * sat);
}
