import * as THREE from 'three';
import { SEEDS, TERRITORY_FACTIONS } from '../world/territory';
import { FACTIONS } from '../world/polities';

// Political territory as a faint cartographic wash on the galactic plane.
// Influence fields (one per polity, a sum of Gaussian seeds) are baked once into
// two half-float textures; the display shader recovers crisp borders from the
// smoothly interpolated fields with screen-space derivatives.

const EXTENT = 125_000; // half-width of the baked map, ly
const SIZE = 1024;

const BAKE_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const BAKE_FRAG = /* glsl */ `
#define NS ${Math.max(SEEDS.length, 1)}
uniform vec4 uSeeds[NS];
uniform int uPass;
varying vec2 vUv;
void main() {
  vec2 p = (vUv * 2.0 - 1.0) * ${EXTENT.toFixed(1)};
  float acc[8];
  for (int k = 0; k < 8; k++) acc[k] = 0.0;
  for (int i = 0; i < NS; i++) {
    vec4 s = uSeeds[i];
    vec2 d = (p - s.xy) / s.z;
    acc[int(s.w + 0.5)] += exp(-2.4 * dot(d, d));
  }
  gl_FragColor = uPass == 0 ? vec4(acc[0], acc[1], acc[2], acc[3]) : vec4(acc[4], acc[5], acc[6], acc[7]);
}`;

const VERT = /* glsl */ `
varying vec2 vXZ;
void main() {
  vXZ = position.xz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec3 uColors[8];
uniform float uDashed[8];
uniform float uFade;
uniform float uHighlight;
varying vec2 vXZ;
const float T = 0.34;
void main() {
  vec2 uv = vXZ / ${(EXTENT * 2).toFixed(1)} + 0.5;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) discard;
  vec4 a = texture2D(uA, uv);
  vec4 b = texture2D(uB, uv);
  float f[7];
  f[0] = a.x; f[1] = a.y; f[2] = a.z; f[3] = a.w; f[4] = b.x; f[5] = b.y; f[6] = b.z;
  float best = 0.0;
  float second = 0.0;
  int bf = -1;
  for (int k = 0; k < 7; k++) {
    // the Exclusion and the Ninefold enclaves are small but sovereign
    float v = (k == 4 || k == 6) ? f[k] * 1.6 : f[k];
    if (v > best) { second = best; best = v; bf = k; }
    else if (v > second) { second = v; }
  }
  if (bf < 0 || best < T * 0.55) discard;
  float fw = fwidth(best) * 1.2 + 1e-6;
  float outer = 1.0 - smoothstep(0.0, fw, abs(best - T));
  float inside = smoothstep(T - fw, T + fw, best);
  float diff = best - second;
  float fd = fwidth(diff) * 1.2 + 1e-6;
  float border = (second > T * 0.85 && inside > 0.5) ? 1.0 - smoothstep(0.0, fd, diff) : 0.0;
  vec3 col = uColors[bf];
  if (uDashed[bf] > 0.5) {
    float ang = atan(vXZ.y, vXZ.x) * 320.0;
    outer *= step(0.0, sin(ang));
  }
  float hl = abs(float(bf) - uHighlight) < 0.5 ? 2.0 : 1.0;
  float fill = inside * (0.018 + 0.03 * smoothstep(T, T * 3.0, best)) * (uDashed[bf] > 0.5 ? 0.6 : 1.0);
  float alpha = (fill + outer * 0.22 + border * 0.18) * hl * uFade;
  gl_FragColor = vec4(col * alpha, 1.0);
}`;

export class Territories {
  readonly mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private rtA: THREE.WebGLRenderTarget;
  private rtB: THREE.WebGLRenderTarget;
  private baked = false;

  constructor() {
    const opts = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      generateMipmaps: false,
    } as const;
    this.rtA = new THREE.WebGLRenderTarget(SIZE, SIZE, opts);
    this.rtB = new THREE.WebGLRenderTarget(SIZE, SIZE, opts);
    const colors: THREE.Vector3[] = [];
    const dashed: number[] = [];
    for (let i = 0; i < 8; i++) {
      const f = TERRITORY_FACTIONS[i];
      const c = new THREE.Color(f ? FACTIONS[f].color : '#ffffff');
      colors.push(new THREE.Vector3(c.r, c.g, c.b));
      dashed.push(f && FACTIONS[f].dashed ? 1 : 0);
    }
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uA: { value: this.rtA.texture },
        uB: { value: this.rtB.texture },
        uColors: { value: colors },
        uDashed: { value: dashed },
        uFade: { value: 1 },
        uHighlight: { value: -1 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const g = new THREE.PlaneGeometry(EXTENT * 2, EXTENT * 2, 1, 1).rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
  }

  bake(renderer: THREE.WebGLRenderer) {
    if (this.baked) return;
    const seeds = SEEDS.map((s) => new THREE.Vector4(s.x, s.z, s.r, s.index));
    if (!seeds.length) seeds.push(new THREE.Vector4(0, 0, 1, 0));
    const mat = new THREE.ShaderMaterial({
      vertexShader: BAKE_VERT,
      fragmentShader: BAKE_FRAG,
      uniforms: { uSeeds: { value: seeds }, uPass: { value: 0 } },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    const scene = new THREE.Scene();
    scene.add(quad);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rtA);
    renderer.render(scene, cam);
    mat.uniforms.uPass.value = 1;
    renderer.setRenderTarget(this.rtB);
    renderer.render(scene, cam);
    renderer.setRenderTarget(prev);
    mat.dispose();
    quad.geometry.dispose();
    this.baked = true;
  }

  update(camera: THREE.PerspectiveCamera, D: number, _pixelScale: number, show: boolean, highlight: number) {
    const dirY = Math.abs(camera.position.clone().sub(this.mesh.position).normalize().y);
    const angle = THREE.MathUtils.smoothstep(dirY, 0.12, 0.4);
    const scale = THREE.MathUtils.smoothstep(D, 9_000, 40_000) * (1 - THREE.MathUtils.smoothstep(D, 900_000, 1_600_000));
    const fade = (show ? 1 : 0) * angle * scale;
    this.mat.uniforms.uFade.value = fade;
    this.mat.uniforms.uHighlight.value = highlight;
    this.mesh.visible = fade > 0.005;
  }
}
