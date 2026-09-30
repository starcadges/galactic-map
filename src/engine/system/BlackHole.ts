import * as THREE from 'three';

// Orrhune. A camera-facing billboard whose fragments integrate null geodesics
// (Schwarzschild approximation, units of the horizon radius) through a thin,
// turbulent, Doppler-beamed accretion disk. The photon ring, the lensed far side
// of the disk and the Einstein ring of background stars fall out of the integration.

const VERT = /* glsl */ `
uniform float uSize;
varying vec3 vViewPos;
varying vec3 vCenter;
void main() {
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vCenter = c.xyz;
  vec4 p = c;
  p.xy += position.xy * uSize;
  vViewPos = p.xyz;
  gl_Position = projectionMatrix * p;
}`;

const FRAG = /* glsl */ `
uniform float uRs;
uniform vec3 uDiskN;
uniform float uTime;
uniform float uInner;
uniform float uOuter;
uniform float uFade;
uniform float uExtent;
varying vec3 vViewPos;
varying vec3 vCenter;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
vec3 stars(vec3 d) {
  vec3 q = d * 90.0;
  vec3 c = floor(q);
  float h = hash13(c);
  if (h < 0.965) return vec3(0.0);
  vec3 f = fract(q) - 0.5;
  float s = exp(-dot(f, f) * 60.0);
  vec3 col = mix(vec3(1.0, 0.75, 0.55), vec3(0.75, 0.85, 1.0), hash13(c + 7.0));
  return col * s * (h - 0.965) * 60.0;
}

void main() {
  vec3 dir = normalize(vViewPos);
  vec3 pos = -vCenter / uRs;
  vec3 vel = dir;
  float R = uExtent;
  float b = dot(pos, vel);
  float cc = dot(pos, pos) - R * R;
  float disc = b * b - cc;
  if (disc < 0.0) discard;
  float tEnter = max(-b - sqrt(disc), 0.0);
  pos += vel * tEnter;
  vec3 hv = cross(pos, vel);
  float h2 = dot(hv, hv);
  vec3 N = normalize(uDiskN);
  vec3 col = vec3(0.0);
  float alpha = 0.0;
  bool captured = false;
  for (int i = 0; i < 150; i++) {
    float r = length(pos);
    if (r < 1.0) { captured = true; break; }
    float dt = clamp(0.085 * r, 0.02, 1.2);
    vec3 prev = pos;
    vec3 acc = -1.5 * h2 * pos / pow(r, 5.0);
    vel += acc * dt;
    pos += vel * dt;
    float s0 = dot(prev, N);
    float s1 = dot(pos, N);
    if (s0 * s1 < 0.0) {
      vec3 hit = mix(prev, pos, s0 / (s0 - s1));
      float rr = length(hit);
      if (rr > uInner && rr < uOuter) {
        vec3 e1 = normalize(cross(N, vec3(0.31, 0.93, 0.18)));
        vec3 e2 = cross(N, e1);
        float ang = atan(dot(hit, e2), dot(hit, e1));
        float omega = 1.6 / pow(rr, 1.5);
        float swirl = ang + uTime * omega;
        float lr = log(rr);
        float turb = vnoise(vec2(lr * 9.0, swirl * 3.0)) * 0.6 + vnoise(vec2(lr * 23.0, swirl * 9.0 + 3.1)) * 0.4;
        float lanes = 0.55 + 0.45 * sin(lr * 40.0 + turb * 4.0);
        float I = pow(uInner / rr, 2.0);
        vec3 hot = vec3(1.0, 0.93, 0.82);
        vec3 warm = vec3(1.0, 0.55, 0.22);
        vec3 cool = vec3(0.75, 0.25, 0.1);
        vec3 c = mix(cool, warm, smoothstep(0.08, 0.35, I));
        c = mix(c, hot, smoothstep(0.35, 0.9, I));
        vec3 vorb = normalize(cross(N, hit));
        float beam = pow(clamp(1.0 + 0.55 * dot(vorb, -normalize(vel)), 0.2, 1.8), 3.0);
        float edge = smoothstep(uInner, uInner * 1.25, rr) * (1.0 - smoothstep(uOuter * 0.6, uOuter, rr));
        float em = I * 2.6 * beam * (0.35 + 0.9 * turb * lanes) * edge;
        float op = clamp(edge * (0.55 + 0.4 * turb), 0.0, 0.95);
        col += (1.0 - alpha) * c * em;
        alpha += (1.0 - alpha) * op;
      }
    }
    if (r > R + 0.5 && dot(pos, vel) > 0.0) break;
  }
  if (captured) {
    alpha = 1.0;
  } else {
    // lensed background: light that skimmed the hole
    float bend = 1.0 - dot(normalize(vel), dir);
    col += (1.0 - alpha) * stars(normalize(vel)) * smoothstep(0.0, 0.02, bend) * 0.8;
  }
  float fadeEdge = 1.0 - smoothstep(0.8, 1.0, length(vViewPos.xy - vCenter.xy) / (uRs * uExtent));
  gl_FragColor = vec4(col * uFade, alpha * uFade * fadeEdge);
}`;

export class BlackHole {
  readonly mesh: THREE.Mesh;
  readonly mat: THREE.ShaderMaterial;
  readonly rs: number;
  private normalLocal = new THREE.Vector3(0.18, 1, -0.12).normalize();
  private tmp = new THREE.Vector3();

  constructor(rs: number) {
    this.rs = rs;
    const extent = 22;
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uRs: { value: rs },
        uSize: { value: rs * extent },
        uExtent: { value: extent },
        uDiskN: { value: new THREE.Vector3(0, 1, 0) },
        uTime: { value: 0 },
        uInner: { value: 3.0 },
        uOuter: { value: 15.0 },
        uFade: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 30;
  }

  get diskNormal() {
    return this.normalLocal;
  }

  update(camera: THREE.Camera, time: number, fade: number) {
    const u = this.mat.uniforms;
    u.uTime.value = time;
    u.uFade.value = fade;
    this.tmp.copy(this.normalLocal).transformDirection(camera.matrixWorldInverse);
    (u.uDiskN.value as THREE.Vector3).copy(this.tmp);
    this.mesh.visible = fade > 0.01;
  }
}
