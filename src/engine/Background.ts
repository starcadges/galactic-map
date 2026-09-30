import * as THREE from 'three';
import { mulberry32, gauss } from '../world/rng';
import { NOISE_GLSL } from './shaders/noise';

// Everything at "infinity": the extragalactic sky. The group rides with the
// camera so its geometry is always camera-relative.

const R = 1.0e6;

const bgPointVert = /* glsl */ `
attribute vec3 color;
attribute float size;
attribute vec2 shape;
uniform float uDpr;
uniform float uFade;
varying vec3 vColor;
varying vec2 vShape;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w * 0.99999;
  gl_PointSize = size * uDpr;
  vColor = color * uFade;
  vShape = shape;
}`;
const bgPointFrag = /* glsl */ `
varying vec3 vColor;
varying vec2 vShape;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float c = cos(vShape.x), s = sin(vShape.x);
  p = mat2(c, -s, s, c) * p;
  p.y /= vShape.y;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vColor * exp(-r2 * 3.5), 1.0);
}`;

const galaxyVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w * 0.99999;
}`;
const galaxyFrag = /* glsl */ `
uniform float uIncl;
uniform float uRot;
uniform float uWind;
uniform float uFlocc;
uniform float uBright;
uniform float uSeed;
uniform vec3 uBulge;
uniform vec3 uDisk;
varying vec2 vUv;
${NOISE_GLSL}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float c = cos(uRot), s = sin(uRot);
  p = mat2(c, -s, s, c) * p;
  p.y /= max(cos(uIncl), 0.12);
  float r = length(p);
  if (r > 1.0) discard;
  float th = atan(p.y, p.x);
  // two-armed log spiral, with a short bar for the Sister
  float spiral = 0.5 + 0.5 * cos(2.0 * (th - log(r + 0.03) * uWind) + uSeed);
  float n = fbm2(p * 9.0 + uSeed * 3.0);
  float n2 = fbm2(p * 26.0 - uSeed);
  float arms = pow(spiral, 2.5) * mix(1.0, n * 1.8, uFlocc) * smoothstep(0.05, 0.25, r) * exp(-r * 3.2);
  float disk = exp(-r * 5.0) * (0.6 + 0.4 * n2);
  float bar = exp(-pow(p.x / 0.22, 2.0) - pow(p.y / 0.07, 2.0)) * (1.0 - uFlocc);
  float bulge = exp(-r * r * 90.0);
  float dust = smoothstep(0.35, 0.7, fbm2(p * 14.0 + uSeed * 7.0)) * pow(spiral, 1.2) * smoothstep(0.1, 0.4, r);
  vec3 col = uBulge * (bulge * 2.4 + bar * 0.9) + uDisk * (arms * 1.5 + disk * 0.7) * (1.0 - dust * 0.6);
  float edge = 1.0 - smoothstep(0.8, 1.0, r);
  gl_FragColor = vec4(col * uBright * edge, 1.0);
}`;

export class Background {
  readonly group = new THREE.Group();
  private pointMat: THREE.ShaderMaterial;
  private galaxyMats: THREE.ShaderMaterial[] = [];
  /** Directions of named extragalactic objects, for labels. */
  readonly named: { id: string; name: string; sub: string; dir: THREE.Vector3 }[] = [];

  constructor() {
    const rng = mulberry32(0xbeef);
    const n = 1_400;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const shape = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const u = rng() * 2 - 1;
      const ph = rng() * Math.PI * 2;
      const q = Math.sqrt(1 - u * u);
      pos[i * 3] = q * Math.cos(ph) * R;
      pos[i * 3 + 1] = u * R;
      pos[i * 3 + 2] = q * Math.sin(ph) * R;
      const galaxy = rng() < 0.55;
      const b = galaxy ? 0.012 + rng() * 0.03 : 0.02 + Math.pow(rng(), 3) * 0.12;
      const warm = rng();
      col[i * 3] = b * (0.9 + warm * 0.2);
      col[i * 3 + 1] = b * (0.85 + warm * 0.05);
      col[i * 3 + 2] = b * (1.05 - warm * 0.35);
      size[i] = galaxy ? 2.5 + rng() * 4.5 : 1.4 + rng() * 1.2;
      shape[i * 2] = rng() * Math.PI;
      shape[i * 2 + 1] = galaxy ? 0.25 + rng() * 0.6 : 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('shape', new THREE.BufferAttribute(shape, 2));
    this.pointMat = new THREE.ShaderMaterial({
      vertexShader: bgPointVert,
      fragmentShader: bgPointFrag,
      uniforms: { uDpr: { value: 1 }, uFade: { value: 1 } },
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const pts = new THREE.Points(geo, this.pointMat);
    pts.frustumCulled = false;
    pts.renderOrder = -10;
    this.group.add(pts);

    // The Sister — the Milky Way, 2.5 million light-years away, barred and grand.
    this.addGalaxy('sister', 'The Sister', 'Milky Way · 2.5 Mly · approaching', new THREE.Vector3(-0.8, -0.34, 0.5), 4.2, {
      incl: 1.05,
      rot: 0.6,
      wind: 2.6,
      flocc: 0.15,
      bright: 0.4,
      seed: 1.3,
      bulge: [1.0, 0.82, 0.6],
      disk: [0.7, 0.78, 1.0],
    });
    // The Pinwheel Neighbour — Triangulum, flocculent and nearly face-on.
    this.addGalaxy('triangulum', 'The Loose Coil', 'Triangulum · 0.75 Mly', new THREE.Vector3(0.55, 0.32, -0.77), 4.2, {
      incl: 0.85,
      rot: 2.1,
      wind: 1.7,
      flocc: 0.85,
      bright: 0.32,
      seed: 4.2,
      bulge: [1.0, 0.9, 0.75],
      disk: [0.62, 0.74, 1.0],
    });
    // A handful of further, anonymous spirals
    const g2 = mulberry32(0x5a7);
    for (let i = 0; i < 14; i++) {
      const d = new THREE.Vector3(gauss(g2), gauss(g2), gauss(g2)).normalize();
      this.addGalaxy('', '', '', d, 0.35 + g2() * 0.7, {
        incl: g2() * 1.3,
        rot: g2() * 6,
        wind: 1.5 + g2() * 2,
        flocc: g2(),
        bright: 0.1 + g2() * 0.15,
        seed: g2() * 10,
        bulge: [1, 0.85, 0.65],
        disk: [0.75, 0.8, 1.0],
      });
    }
  }

  private addGalaxy(
    id: string,
    name: string,
    sub: string,
    dir: THREE.Vector3,
    angularDeg: number,
    o: {
      incl: number;
      rot: number;
      wind: number;
      flocc: number;
      bright: number;
      seed: number;
      bulge: [number, number, number];
      disk: [number, number, number];
    },
  ) {
    dir.normalize();
    const size = 2 * R * Math.tan(THREE.MathUtils.degToRad(angularDeg / 2));
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.ShaderMaterial({
      vertexShader: galaxyVert,
      fragmentShader: galaxyFrag,
      uniforms: {
        uIncl: { value: o.incl },
        uRot: { value: o.rot },
        uWind: { value: o.wind },
        uFlocc: { value: o.flocc },
        uBright: { value: o.bright },
        uSeed: { value: o.seed },
        uBulge: { value: new THREE.Vector3(...o.bulge) },
        uDisk: { value: new THREE.Vector3(...o.disk) },
      },
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
      side: THREE.DoubleSide,
    });
    mat.userData.baseBright = o.bright;
    this.galaxyMats.push(mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(dir).multiplyScalar(R);
    m.lookAt(0, 0, 0);
    m.renderOrder = -9;
    m.frustumCulled = false;
    this.group.add(m);
    if (id) this.named.push({ id, name, sub, dir: dir.clone() });
  }

  update(camera: THREE.Camera, dpr: number, fade: number) {
    this.group.position.copy(camera.position);
    this.group.updateMatrixWorld(true);
    this.pointMat.uniforms.uDpr.value = dpr;
    this.pointMat.uniforms.uFade.value = fade;
    for (const m of this.galaxyMats) m.uniforms.uBright.value = m.userData.baseBright * fade;
  }
}
