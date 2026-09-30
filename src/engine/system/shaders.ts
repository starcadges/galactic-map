import { SIMPLEX3_GLSL } from '../shaders/noise';

// All lighting is computed in view space or system-local space. World-space
// coordinates can be 10^5 ly from the origin and must never reach a shader.

export const PLANET_TYPES = [
  'terran',
  'garden',
  'ocean',
  'reef',
  'desert',
  'terraform',
  'ice',
  'lava',
  'gas',
  'icegiant',
  'city',
  'barren',
  'twilight',
  'toxic',
  'machine',
  'bloom',
  'glass',
  'hollow',
  'rogue',
] as const;

export const BODY_VERT = /* glsl */ `
varying vec3 vObj;
varying vec3 vNormalV;
varying vec3 vPosV;
void main() {
  vObj = position;
  vNormalV = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

export const PLANET_FRAG = /* glsl */ `
uniform int uType;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform float uSeed;
uniform float uLights;
uniform float uClouds;
uniform float uTime;
uniform vec3 uStarPos[3];
uniform vec3 uStarCol[3];
uniform int uStarN;
uniform float uAmbient;
varying vec3 vObj;
varying vec3 vNormalV;
varying vec3 vPosV;
${SIMPLEX3_GLSL}

float cityMask(vec3 p, float scale) {
  // regional density x clustered settlements x individual lights
  float region = smoothstep(-0.05, 0.45, fbm3(p * scale * 0.5 + uSeed * 3.1, 3));
  float towns = pow(max(snoise(p * scale * 7.0 + uSeed * 1.7), 0.0), 2.0) * 1.6;
  float lights = pow(max(snoise(p * scale * 22.0 + uSeed * 0.3), 0.0), 3.0) * 2.2;
  float roads = (1.0 - smoothstep(0.0, 0.035, abs(snoise(p * scale * 3.0 - uSeed)))) * 0.35;
  return region * clamp(towns + lights + roads * towns, 0.0, 1.4);
}

void main() {
  vec3 p = normalize(vObj);
  vec3 n = normalize(vNormalV);
  vec3 V = normalize(-vPosV);
  vec3 light = vec3(0.0);
  float day = 0.0;
  float spec = 0.0;
  for (int i = 0; i < 3; i++) {
    if (i >= uStarN) break;
    vec3 L = normalize(uStarPos[i] - vPosV);
    float ndl = dot(n, L);
    light += uStarCol[i] * max(ndl, 0.0);
    day = max(day, smoothstep(-0.15, 0.25, ndl));
    vec3 H = normalize(L + V);
    spec += pow(max(dot(n, H), 0.0), 60.0) * step(0.0, ndl) * length(uStarCol[i]) * 0.5;
  }
  vec3 seedv = vec3(uSeed * 1.7, uSeed * 2.3, uSeed * 0.9);
  float h = fbm3(p * 2.1 + seedv, 6);
  float lat = abs(p.y);
  vec3 alb = uC1;
  float emis = 0.0;
  vec3 emisCol = vec3(1.0, 0.72, 0.42);
  float wet = 0.0;
  float land = 1.0;
  float clouds = uClouds;

  if (uType == 0 || uType == 1 || uType == 2 || uType == 3) {
    float sea = uType == 2 ? 0.22 : uType == 3 ? 0.14 : uType == 1 ? -0.02 : 0.02;
    land = smoothstep(sea - 0.01, sea + 0.02, h);
    vec3 shallow = mix(uC0, vec3(0.2, 0.55, 0.6), 0.35);
    vec3 ocean = mix(uC0 * 0.6, shallow, smoothstep(sea - 0.25, sea, h));
    if (uType == 3) {
      float reef = smoothstep(0.02, 0.0, abs(h - sea + 0.05)) + smoothstep(0.7, 0.9, snoise(p * 24.0 + seedv)) * smoothstep(sea - 0.15, sea, h);
      ocean = mix(ocean, vec3(0.75, 0.62, 0.5), clamp(reef, 0.0, 1.0) * 0.6);
    }
    float hh = clamp((h - sea) * 2.0, 0.0, 1.0);
    vec3 ground = mix(uC1, uC2, smoothstep(0.1, 0.7, hh + snoise(p * 7.0 + seedv) * 0.15));
    ground = mix(ground, vec3(0.92, 0.94, 0.96), smoothstep(0.62, 0.8, hh));
    alb = mix(ocean, ground, land);
    float ice = smoothstep(0.72, 0.86, lat + snoise(p * 5.0) * 0.06);
    alb = mix(alb, vec3(0.9, 0.93, 0.96), ice);
    wet = (1.0 - land) * (1.0 - ice);
    emis = cityMask(p, 7.0) * land * (1.0 - ice);
  } else if (uType == 4 || uType == 16) {
    float dunes = sin((p.y * 40.0 + snoise(p * 6.0 + seedv) * 3.0)) * 0.5 + 0.5;
    alb = mix(uC0, uC2, smoothstep(-0.3, 0.5, h));
    alb = mix(alb, uC1, dunes * 0.25);
    if (uType == 16) { alb = mix(alb, vec3(0.7, 0.8, 0.85), 0.4); spec *= 3.0; }
    emis = cityMask(p, 6.0) * 0.7;
    clouds *= 0.3;
  } else if (uType == 5) {
    // terraforming front: the Line, advancing south
    float front = p.y + snoise(p * 3.0 + seedv) * 0.16 + snoise(p * 11.0) * 0.04;
    float green = smoothstep(-0.05, 0.08, front);
    vec3 desert = mix(uC0, uC1, smoothstep(-0.3, 0.4, h));
    vec3 grown = mix(uC2, uC2 * 0.6 + vec3(0.05, 0.1, 0.12), smoothstep(0.0, 0.4, h));
    float lake = smoothstep(0.12, 0.2, -h) * green;
    alb = mix(desert, grown, green);
    alb = mix(alb, vec3(0.1, 0.25, 0.35), lake);
    wet = lake;
    emis = cityMask(p, 8.0) * green * 0.8;
    clouds *= green;
  } else if (uType == 6) {
    float cracks = 1.0 - smoothstep(0.0, 0.04, abs(snoise(p * 9.0 + seedv)));
    alb = mix(vec3(0.82, 0.88, 0.94), vec3(0.62, 0.72, 0.82), smoothstep(-0.2, 0.4, h));
    alb = mix(alb, vec3(0.45, 0.55, 0.65), cracks * 0.5);
    emis = cityMask(p, 6.0) * 0.5;
    clouds *= 0.2;
  } else if (uType == 7) {
    float cr = 1.0 - smoothstep(0.0, 0.06, abs(snoise(p * 7.0 + seedv + uTime * 0.01)));
    alb = mix(vec3(0.08, 0.06, 0.05), vec3(0.2, 0.14, 0.1), h + 0.5);
    emis = cr * 1.2;
    emisCol = vec3(1.0, 0.35, 0.08);
    day = 0.0;
    clouds = 0.0;
  } else if (uType == 8 || uType == 9) {
    float warp = fbm3(p * vec3(2.0, 5.0, 2.0) + seedv + vec3(uTime * 0.004, 0.0, 0.0), 4);
    float bands = sin(p.y * (uType == 8 ? 18.0 : 9.0) + warp * 3.5) * 0.5 + 0.5;
    float fine = sin(p.y * 55.0 + warp * 6.0) * 0.5 + 0.5;
    alb = mix(uC0, uC1, bands);
    alb = mix(alb, uC2, fine * 0.35 * smoothstep(0.1, 0.6, 1.0 - lat));
    float storm = smoothstep(0.82, 0.95, 1.0 - length(p - normalize(vec3(0.6, -0.35, 0.7))) * 3.0);
    alb = mix(alb, uC2 * 1.1, storm);
    clouds = 0.0;
    emis = 0.0;
  } else if (uType == 10) {
    // ecumenopolis: city on city. Arterials are noise contours; districts are patches.
    float districts = fbm3(p * 7.0 + seedv, 4);
    float art = 1.0 - smoothstep(0.0, 0.03, abs(snoise(p * 11.0 + seedv)));
    float streets = 1.0 - smoothstep(0.0, 0.05, abs(snoise(p * 47.0 - seedv)));
    float blocks = snoise(p * 140.0 + seedv * 3.0) * 0.5 + 0.5;
    alb = mix(uC0, uC1, smoothstep(-0.5, 0.5, districts)) * (0.7 + 0.3 * blocks);
    alb = mix(alb, uC2, art * 0.5 + streets * 0.15) * 0.55;
    float dense = smoothstep(-0.3, 0.5, districts);
    emis = dense * (0.03 + 0.7 * pow(blocks, 7.0)) + art * (0.35 + 0.4 * dense) + streets * 0.1 * dense;
    wet = 0.2;
  } else if (uType == 11) {
    float crater = smoothstep(0.55, 0.75, abs(snoise(p * 5.0 + seedv))) * 0.25 + smoothstep(0.6, 0.8, abs(snoise(p * 13.0 + seedv))) * 0.15;
    alb = mix(uC0, uC2, h * 0.5 + 0.5) - crater * 0.3;
    if (dot(uC0, vec3(1.0)) < 0.01) alb = mix(vec3(0.32, 0.3, 0.28), vec3(0.55, 0.52, 0.48), h * 0.5 + 0.5) - crater * 0.3;
    emis = cityMask(p, 5.0) * 0.6;
    clouds = 0.0;
  } else if (uType == 12) {
    // tidally locked: +X faces the star
    float s = p.x + snoise(p * 4.0 + seedv) * 0.08;
    float streak = fbm3(p * vec3(3.0, 12.0, 3.0) + seedv, 4);
    vec3 dayc = mix(vec3(0.72, 0.58, 0.44), vec3(0.93, 0.86, 0.72), smoothstep(-0.4, 0.5, h + streak * 0.4));
    dayc = mix(dayc, vec3(0.55, 0.62, 0.66), smoothstep(0.3, 0.6, streak) * 0.35);
    vec3 nightc = mix(vec3(0.75, 0.82, 0.9), vec3(0.9, 0.94, 0.98), h * 0.5 + 0.5);
    vec3 band = mix(uC1, uC2, smoothstep(-0.2, 0.4, h));
    float river = 1.0 - smoothstep(0.0, 0.05, abs(snoise(p * 14.0 + seedv)));
    band = mix(band, vec3(0.15, 0.3, 0.4), river * 0.6);
    alb = mix(nightc, band, smoothstep(-0.42, -0.2, s));
    alb = mix(alb, dayc, smoothstep(0.2, 0.42, s));
    float ev = 1.0 - smoothstep(0.0, 0.28, abs(s));
    emis = ev * (0.4 + 0.6 * cityMask(p, 9.0));
    clouds *= ev;
  } else if (uType == 13) {
    float swirl = fbm3(p * 3.0 + seedv + vec3(uTime * 0.01, 0.0, 0.0), 5);
    alb = mix(vec3(0.55, 0.55, 0.2), vec3(0.75, 0.7, 0.35), swirl * 0.5 + 0.5);
    clouds = 0.0;
    emis = 0.0;
  } else if (uType == 14) {
    vec3 g = abs(fract(p * 34.0 + seedv) - 0.5);
    float lines = smoothstep(0.44, 0.5, max(max(g.x, g.y), g.z));
    float pulse = 0.5 + 0.5 * sin(uTime * 0.8 + h * 20.0);
    alb = mix(uC0, uC1, h * 0.5 + 0.5);
    emis = lines * (0.35 + 0.4 * pulse) + 0.08;
    emisCol = vec3(0.45, 0.85, 1.0);
    day = 0.0;
    clouds = 0.0;
  } else if (uType == 15) {
    float f = fbm3(p * 2.5 + seedv + vec3(0.0, uTime * 0.006, 0.0), 5);
    float g2 = fbm3(p * 7.0 - seedv + vec3(uTime * 0.01), 4);
    vec3 a = mix(uC0, uC1, smoothstep(-0.4, 0.4, f));
    alb = mix(a, uC2, smoothstep(0.1, 0.5, g2));
    alb += 0.15 * vec3(sin(f * 12.0), sin(f * 12.0 + 2.0), sin(f * 12.0 + 4.0));
    spec *= 2.5;
    clouds = 0.0;
    emis = smoothstep(0.35, 0.6, g2) * 0.25;
    emisCol = vec3(0.6, 1.0, 0.8);
  } else if (uType == 17) {
    alb = mix(uC0, uC1, h * 0.5 + 0.5);
    float vents = smoothstep(0.62, 0.8, fbm3(p * 10.0 + seedv, 3));
    emis = vents * 0.9 + cityMask(p, 6.0) * 0.25;
    emisCol = vec3(1.0, 0.45, 0.2);
    clouds *= 0.4;
  } else if (uType == 18) {
    // rogue: an ocean under ice, lit from within
    float cracks = 1.0 - smoothstep(0.0, 0.05, abs(snoise(p * 8.0 + seedv)));
    alb = mix(vec3(0.05, 0.07, 0.09), vec3(0.12, 0.15, 0.18), h * 0.5 + 0.5);
    float glow = cityMask(p, 5.0);
    emis = glow * 0.7 + cracks * 0.25;
    emisCol = vec3(0.35, 0.7, 1.0);
    day = 0.0;
    clouds = 0.0;
  }

  vec3 col = alb * (light + uAmbient);
  col += spec * wet * 0.6;
  // clouds
  if (clouds > 0.0) {
    float cl = fbm3(p * 3.2 + seedv * 2.0 + vec3(uTime * 0.006, 0.0, uTime * 0.003), 5);
    float cm = smoothstep(0.02, 0.45, cl) * clouds;
    col = mix(col, vec3(0.95) * (light + uAmbient * 0.5), cm * 0.85);
    emis *= 1.0 - cm * 0.7;
  }
  float night = 1.0 - day;
  col += emisCol * emis * uLights * night * 1.8;
  if (uType == 7 || uType == 14 || uType == 18) col += emisCol * emis * 0.6;
  gl_FragColor = vec4(col, 1.0);
}`;

export const ATMOS_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uStarPos[3];
uniform int uStarN;
uniform float uStrength;
varying vec3 vObj;
varying vec3 vNormalV;
varying vec3 vPosV;
void main() {
  vec3 n = normalize(vNormalV);
  vec3 V = normalize(-vPosV);
  float rim = 1.0 - max(dot(n, V), 0.0);
  float lit = 0.0;
  for (int i = 0; i < 3; i++) {
    if (i >= uStarN) break;
    vec3 L = normalize(uStarPos[i] - vPosV);
    lit = max(lit, smoothstep(-0.35, 0.4, dot(n, L)));
  }
  float a = pow(rim, 3.2) * (0.15 + 1.1 * lit) * uStrength;
  gl_FragColor = vec4(uColor * a, 1.0);
}`;

export const STAR_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uTime;
uniform float uBright;
uniform float uSeed;
uniform float uScale;
varying vec3 vObj;
varying vec3 vNormalV;
varying vec3 vPosV;
${SIMPLEX3_GLSL}
void main() {
  vec3 n = normalize(vNormalV);
  vec3 V = normalize(-vPosV);
  float mu = max(dot(n, V), 0.0);
  float limb = 0.3 + 0.7 * pow(mu, 0.5);
  vec3 p = normalize(vObj);
  float g = fbm3(p * uScale * 2.2 + vec3(uSeed, uTime * 0.03, uTime * 0.02), 4);
  float spots = smoothstep(0.58, 0.72, fbm3(p * 2.0 + uSeed + uTime * 0.005, 3));
  float c = 0.9 + 0.16 * g - spots * 0.3;
  vec3 col = uColor * uBright * limb * c;
  // warmer limb
  col *= mix(vec3(1.0, 0.72, 0.5), vec3(1.0), pow(mu, 0.4));
  gl_FragColor = vec4(col, 1.0);
}`;

export const GLOW_VERT = /* glsl */ `
uniform float uSize;
varying vec2 vUv;
void main() {
  vUv = position.xy;
  vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  c.xy += position.xy * uSize;
  gl_Position = projectionMatrix * c;
}`;

export const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uBright;
uniform float uCore;
varying vec2 vUv;
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  float halo = pow(1.0 - r, 4.0) * 0.28 + pow(1.0 - r, 12.0) * 0.5;
  float inner = exp(-r * r / (uCore * uCore)) * 1.1;
  float ray = pow(max(0.0, 1.0 - abs(vUv.y) * 60.0), 2.0) * pow(1.0 - r, 2.0) * 0.25 + pow(max(0.0, 1.0 - abs(vUv.x) * 60.0), 2.0) * pow(1.0 - r, 2.0) * 0.15;
  // keep the chroma: a K star should read orange, an M star red
  vec3 col = uColor * uBright * (halo * 1.2 + inner * 0.85 + ray);
  gl_FragColor = vec4(col, 1.0);
}`;

export const RING_VERT = /* glsl */ `
varying vec2 vLocal;
varying vec3 vPosV;
void main() {
  vLocal = position.xy;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

export const RING_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uInner;
uniform float uOuter;
uniform int uStyle;
uniform float uTime;
uniform vec3 uStarPos;
uniform float uOpacity;
uniform vec3 uPlanetPosV;
uniform float uPlanetR;
varying vec2 vLocal;
varying vec3 vPosV;
float h1(float x) { return fract(sin(x * 91.3) * 43758.5); }
void main() {
  float r = length(vLocal);
  float t = (r - uInner) / (uOuter - uInner);
  if (t < 0.0 || t > 1.0) discard;
  float ang = atan(vLocal.y, vLocal.x);
  // planet shadow on the ring
  vec3 L = normalize(uStarPos - vPosV);
  vec3 toP = uPlanetPosV - vPosV;
  float along = dot(toP, L);
  float perp = length(toP - L * along);
  float shadow = along > 0.0 ? smoothstep(uPlanetR * 0.9, uPlanetR * 1.1, perp) : 1.0;
  vec3 col;
  float a;
  if (uStyle == 0) {
    float bands = 0.55 + 0.45 * sin(t * 90.0 + sin(t * 23.0) * 3.0);
    float gaps = smoothstep(0.02, 0.06, abs(t - 0.62));
    a = bands * gaps * (1.0 - smoothstep(0.85, 1.0, t)) * smoothstep(0.0, 0.08, t) * uOpacity;
    col = uColor * (0.25 + 0.9 * shadow) * a;
  } else if (uStyle == 1) {
    // inhabited orbital ring: bright, segmented, lit windows on the shadowed side
    float edge = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.95, 1.0, t));
    float seg = step(0.08, fract(ang * 64.0 / 6.2831));
    float lanes = 0.7 + 0.3 * step(0.5, fract(t * 6.0));
    float lights = step(0.62, h1(floor(ang * 900.0) + floor(t * 12.0) * 13.0));
    a = edge * uOpacity;
    col = uColor * lanes * seg * (0.15 + 1.1 * shadow) * a + vec3(1.0, 0.8, 0.5) * lights * (1.0 - shadow * 0.8) * a * 1.4;
  } else if (uStyle == 2) {
    float edge = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.9, 1.0, t));
    float seg = step(0.3, fract(ang * 40.0 / 6.2831));
    float hot = step(0.93, h1(floor(ang * 300.0) + floor(t * 5.0)));
    a = edge * seg * uOpacity * (0.6 + 0.4 * step(0.5, fract(t * 3.0)));
    col = uColor * (0.2 + 0.8 * shadow) * a + vec3(1.0, 0.6, 0.3) * hot * a * 2.0;
  } else {
    float lat = step(0.9, fract(ang * 24.0 / 6.2831)) + step(0.85, fract(t * 4.0));
    a = clamp(lat, 0.0, 1.0) * uOpacity * 0.8;
    col = uColor * a;
  }
  gl_FragColor = vec4(col, a);
}`;

// Instances on circular orbits, animated on the GPU.
// iOrbit = (radius, inclination, node, phase); iMisc = (angular speed, scale, spin, kind-specific)
export const ORBIT_INST_VERT = /* glsl */ `
attribute vec4 iOrbit;
attribute vec4 iMisc;
attribute vec3 iColor;
uniform float uTime;
uniform float uFaceStar;
varying vec3 vN;
varying vec3 vP;
varying vec3 vCol;
varying float vFacing;
varying vec3 vLocal;
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }
void main() {
  float ang = iOrbit.w + uTime * iMisc.x;
  float r = iOrbit.x;
  mat3 orient = rotY(iOrbit.z) * rotX(iOrbit.y);
  vec3 op = orient * vec3(cos(ang) * r, 0.0, sin(ang) * r);
  vec3 radial = normalize(op);
  vec3 tangent = orient * vec3(-sin(ang), 0.0, cos(ang));
  vec3 up = normalize(cross(tangent, radial));
  mat3 frame = mat3(tangent, up, radial);
  if (uFaceStar < 0.5) {
    float sp = iMisc.z * uTime;
    frame = frame * rotY(sp);
  }
  vLocal = position;
  vec3 lp = frame * (position * iMisc.y);
  vec3 sysPos = op + lp;
  vN = frame * normal;
  vP = sysPos;
  vCol = iColor;
  vFacing = dot(vN, -radial);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(sysPos, 1.0);
}`;

export const ORBIT_INST_FRAG = /* glsl */ `
uniform vec3 uStarCol;
uniform float uEmissive;
uniform float uTime;
varying vec3 vN;
varying vec3 vP;
varying vec3 vCol;
varying float vFacing;
varying vec3 vLocal;
void main() {
  vec3 L = normalize(-vP);
  vec3 n = normalize(vN);
  float ndl = max(dot(n, L), 0.0);
  float back = max(dot(-n, L), 0.0);
  vec3 col = vCol * (uStarCol * (ndl + back * 0.15) + 0.03);
  float blink = step(0.9, fract(uTime * 0.5 + vP.x * 37.0 + vP.z * 11.0));
  col += vCol * uEmissive * (0.35 + 0.65 * blink) * step(0.3, fract(vLocal.x * 3.0 + 0.5));
  gl_FragColor = vec4(col, 1.0);
}`;

// Additive glowing points (lights, ships, buoys) in system-local space.
export const LIGHT_POINTS_VERT = /* glsl */ `
attribute vec3 color;
attribute float size;
attribute float phase;
uniform float uDpr;
uniform float uTime;
uniform float uFade;
uniform float uPx;
varying vec3 vCol;
varying float vA;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = -mv.z;
  float blink = phase < 0.0 ? 1.0 : 0.35 + 0.65 * step(0.75, fract(uTime * 0.7 + phase));
  float px = size * uPx / max(d, 1e-9);
  float s = clamp(px, 1.5, 7.0) * uDpr;
  gl_PointSize = s;
  vCol = color * blink * uFade;
  vA = clamp(px / 1.5, 0.15, 1.0);
}`;

export const LIGHT_POINTS_FRAG = /* glsl */ `
varying vec3 vCol;
varying float vA;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p);
  if (r2 > 1.0) discard;
  gl_FragColor = vec4(vCol * exp(-r2 * 4.0) * vA, 1.0);
}`;
