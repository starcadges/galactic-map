import * as THREE from 'three';
import { generateDust, generateHaze, generateNebulae, generateStars, type SplatSet } from './generate';
import { NOISE_GLSL } from '../shaders/noise';

// Galaxy-scale representation: point "star clouds" and Gaussian splats.

const starVert = /* glsl */ `
uniform float uPixelScale;
uniform float uBright;
uniform float uTime;
uniform float uNearA;
uniform float uNearB;
uniform float uDpr;
uniform float uFade;
attribute vec3 color;
attribute float lum;
attribute float phase;
varying vec3 vColor;
varying float vPeak;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
  float F = lum * uBright * (1.0e5 / max(dist, 1.0));
  F = F / (1.0 + F * 0.12);
  F *= 1.0 + 0.08 * sin(uTime * (0.5 + fract(phase) * 2.0) + phase);
  F *= smoothstep(uNearA, uNearB, dist) * uFade;
  float base = 1.3 * uDpr;
  float s = min(base * (1.0 + 0.5 * sqrt(F)), 5.0 * uDpr);
  gl_PointSize = s;
  vPeak = F / ((s / base) * (s / base));
  vColor = color;
  if (vPeak < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const starFrag = /* glsl */ `
varying vec3 vColor;
varying float vPeak;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  float a = exp(-r2 * 5.0) + 0.06 * (1.0 - r2);
  gl_FragColor = vec4(vColor * vPeak * a, 1.0);
}`;

export const SPLAT_VERT = /* glsl */ `
attribute vec3 iCenter;
attribute vec3 iA;
attribute vec3 iB;
attribute vec3 iC;
attribute vec3 iColor;
attribute vec4 iParams;
uniform float uPixelScale;
uniform float uSigma;
uniform float uStrength;
uniform float uTime;
uniform float uNearK;
varying vec2 vUV;
varying vec3 vColor;
varying float vPeak;
varying float vSeed;
void main() {
  vec4 c = modelViewMatrix * vec4(iCenter, 1.0);
  mat3 m = mat3(modelViewMatrix);
  // gentle breathing so the dust never looks frozen
  vec3 wob = vec3(sin(uTime * 0.05 + iParams.y * 40.0), 0.0, cos(uTime * 0.043 + iParams.y * 31.0)) * 0.02;
  vec3 a = m * (iA * (1.0 + wob.x));
  vec3 b = m * (iB * (1.0 + wob.z));
  vec3 cc = m * iC;
  float sxx = a.x * a.x + b.x * b.x + cc.x * cc.x;
  float sxy = a.x * a.y + b.x * b.y + cc.x * cc.y;
  float syy = a.y * a.y + b.y * b.y + cc.y * cc.y;
  float tr = 0.5 * (sxx + syy);
  float det2 = max(sxx * syy - sxy * sxy, 1e-12 * tr * tr);
  float disc = sqrt(max(tr * tr - det2, 0.0));
  float l1 = tr + disc;
  float l2 = max(tr - disc, 1e-8 * l1);
  vec2 e1 = abs(sxy) > 1e-7 * l1 ? normalize(vec2(sxy, l1 - sxx)) : (sxx >= syy ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
  vec2 e2 = vec2(-e1.y, e1.x);
  float r1 = sqrt(l1);
  float r2 = sqrt(l2);
  float depth = max(-c.z, 1e-6);
  float px = uPixelScale / depth;
  float minR = 0.9 / px;
  float k1 = max(r1, minR);
  float k2 = max(r2, minR);
  float energy = (r1 * r2) / (k1 * k2);
  vec2 off = (position.x * k1 * e1 + position.y * k2 * e2) * uSigma;
  gl_Position = projectionMatrix * vec4(c.xy + off, c.z, 1.0);
  vUV = position.xy * uSigma;

  float la = length(iA), lb = length(iB), lc = length(iC);
  float rmax = max(la, max(lb, lc));
  float rmin = min(la, min(lb, lc));
  float det3 = abs(dot(a, cross(b, cc)));
  float thick = (det3 / sqrt(det2)) / rmin;
  thick = thick / (1.0 + thick / 2.5);
  float dist = length(c.xyz);
  float nearF = smoothstep(rmax * 0.6 * uNearK, rmax * 2.2 * uNearK, dist);
  vPeak = iParams.x * uStrength * thick * energy * nearF;
  vColor = iColor;
  vSeed = iParams.y;
  if (vPeak < 1e-4 || c.z > -rmax * 0.2) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const splatFrag = /* glsl */ `
varying vec2 vUV;
varying vec3 vColor;
varying float vPeak;
varying float vSeed;
${NOISE_GLSL}
void main() {
  float r2 = dot(vUV, vUV);
  float g = exp(-0.5 * r2);
  g = max(g - 0.011, 0.0) * 1.011;
  if (g <= 0.0) discard;
#if KIND == 2
  // Dust: Beer–Lambert absorption, reddening transmitted light.
  float n = smoothstep(0.28, 0.85, fbm2(vUV * 1.1 + vSeed * 17.0)) * 1.6;
  float tau = vPeak * g * n;
  vec3 absorb = vec3(1.0) - exp(-tau * vec3(0.78, 0.9, 1.0));
  gl_FragColor = vec4(absorb, 1.0);
#elif KIND == 1
  float n = fbm2(vUV * 0.75 + vSeed * 23.0);
  float w = smoothstep(0.25, 0.9, n) * 1.4 + 0.12;
  gl_FragColor = vec4(vColor * vPeak * g * w, 1.0);
#else
  gl_FragColor = vec4(vColor * vPeak * g, 1.0);
#endif
}`;

function makeSplatMesh(set: SplatSet, kind: 0 | 1 | 2, strength: number, sigma: number): THREE.Mesh {
  const quad = new THREE.PlaneGeometry(2, 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = quad.index;
  geo.setAttribute('position', quad.getAttribute('position'));
  geo.setAttribute('iCenter', new THREE.InstancedBufferAttribute(set.center, 3));
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(set.axisA, 3));
  geo.setAttribute('iB', new THREE.InstancedBufferAttribute(set.axisB, 3));
  geo.setAttribute('iC', new THREE.InstancedBufferAttribute(set.axisC, 3));
  geo.setAttribute('iColor', new THREE.InstancedBufferAttribute(set.color, 3));
  geo.setAttribute('iParams', new THREE.InstancedBufferAttribute(set.params, 4));
  geo.instanceCount = set.count;

  const mat = new THREE.ShaderMaterial({
    vertexShader: SPLAT_VERT,
    fragmentShader: splatFrag,
    defines: { KIND: kind },
    uniforms: {
      uPixelScale: { value: 1000 },
      uSigma: { value: sigma },
      uStrength: { value: strength },
      uTime: { value: 0 },
      uNearK: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
  if (kind === 2) {
    mat.blending = THREE.CustomBlending;
    mat.blendEquation = THREE.AddEquation;
    mat.blendSrc = THREE.ZeroFactor;
    mat.blendDst = THREE.OneMinusSrcColorFactor;
  } else {
    mat.blending = THREE.AdditiveBlending;
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export class GalaxyLayer {
  readonly group = new THREE.Group();
  readonly stars: THREE.Points;
  readonly haze: THREE.Mesh;
  readonly dust: THREE.Mesh;
  readonly nebulae: THREE.Mesh;
  readonly starCount: number;
  private starMat: THREE.ShaderMaterial;

  constructor() {
    const cloud = generateStars();
    this.starCount = cloud.count;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cloud.position, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(cloud.color, 3));
    geo.setAttribute('lum', new THREE.BufferAttribute(cloud.lum, 1));
    geo.setAttribute('phase', new THREE.BufferAttribute(cloud.phase, 1));
    this.starMat = new THREE.ShaderMaterial({
      vertexShader: starVert,
      fragmentShader: starFrag,
      uniforms: {
        uPixelScale: { value: 1000 },
        uBright: { value: 0.55 },
        uTime: { value: 0 },
        uNearA: { value: 700 },
        uNearB: { value: 3_200 },
        uDpr: { value: 1 },
        uFade: { value: 1 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.stars = new THREE.Points(geo, this.starMat);
    this.stars.frustumCulled = false;
    this.stars.renderOrder = 2;

    this.haze = makeSplatMesh(generateHaze(), 0, 1.0, 3.0);
    this.haze.renderOrder = 1;
    this.nebulae = makeSplatMesh(generateNebulae(), 1, 1.0, 3.0);
    this.nebulae.renderOrder = 3;
    this.dust = makeSplatMesh(generateDust(), 2, 1.0, 3.0);
    this.dust.renderOrder = 4;

    this.group.add(this.haze, this.stars, this.nebulae, this.dust);
  }

  update(time: number, pixelScale: number, dpr: number, viewDist: number) {
    const su = this.starMat.uniforms;
    su.uTime.value = time;
    su.uPixelScale.value = pixelScale;
    su.uDpr.value = dpr;
    // As we descend below ~2,000 ly the representative star clouds hand over
    // to the resolved local star field.
    const near = THREE.MathUtils.clamp(viewDist * 0.9, 250, 3_000);
    su.uNearA.value = near * 0.35;
    su.uNearB.value = near * 1.6;
    // Diffuse starlight is how a galaxy looks from outside. From inside the disk the
    // same light must not become fog: the sky should stay dark, with a band.
    const outside = THREE.MathUtils.smoothstep(viewDist, 1_500, 45_000);
    const k = [0.1 + 0.9 * outside, 0.4 + 0.6 * outside, 0.12 + 0.88 * outside];
    // and nearby diffuse structures dissolve sooner, leaving only the distant band
    const nearK = 1 + 3 * (1 - outside);
    [this.haze, this.dust, this.nebulae].forEach((m, i) => {
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uPixelScale.value = pixelScale;
      u.uTime.value = time;
      u.uStrength.value = this.baseStrength[i] * k[i];
      u.uNearK.value = nearK;
    });
  }

  baseStrength = [1, 1, 1];
  setStrengths(haze: number, dust: number, neb: number) {
    this.baseStrength = [haze, dust, neb];
  }
}
