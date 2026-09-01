import * as THREE from 'three';
import type { Finish } from './parts';

const vertexShader = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vWorldNormal;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3  uBaseColor;
uniform float uRoughness;
uniform float uMetalness;

uniform vec3  uKeyDir;
uniform vec3  uKeyColor;
uniform float uKeyIntensity;

uniform vec3  uStreak1Dir;
uniform vec3  uStreak1Color;
uniform float uStreak1Tight;

uniform vec3  uStreak2Dir;
uniform vec3  uStreak2Color;
uniform float uStreak2Tight;

uniform vec3  uHorizonUp;
uniform vec3  uHorizonDown;
uniform float uHorizonStrength;

uniform float uFresnelPower;
uniform float uReflectivity;
uniform float uTransmission;
uniform float uIor;
uniform float uDispersion;
uniform float uIridescence;
uniform float uOpacity;
uniform float uExposure;
uniform float uRimStrength;
uniform float uRimPower;
uniform vec3  uRimColor;
uniform float uMicroStrength;
uniform float uMicroScale;
uniform float uClearcoat;

varying vec3 vWorldPos;
varying vec3 vWorldNormal;

const float PI = 3.141592653589793;

// 程序化环境：地平线渐变 + 三盏具名光的"光源盘"，反射和折射都采样它
vec3 envSample(vec3 dir) {
  float h = smoothstep(-0.6, 0.9, dir.y);
  vec3 env = mix(uHorizonDown, uHorizonUp, h) * uHorizonStrength;

  env += uKeyColor * uKeyIntensity * 0.55 * pow(max(dot(dir, uKeyDir), 0.0), 24.0);
  env += uStreak1Color * pow(max(dot(dir, uStreak1Dir), 0.0), uStreak1Tight * 0.35);
  env += uStreak2Color * pow(max(dot(dir, uStreak2Dir), 0.0), uStreak2Tight * 0.35);
  return env;
}

float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i), hash31(i + vec3(1.0,0.0,0.0)), f.x),
        mix(hash31(i + vec3(0.0,1.0,0.0)), hash31(i + vec3(1.0,1.0,0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0,0.0,1.0)), hash31(i + vec3(1.0,0.0,1.0)), f.x),
        mix(hash31(i + vec3(0.0,1.0,1.0)), hash31(i + vec3(1.0,1.0,1.0)), f.x), f.y),
    f.z);
}

// 参考真机 normal map 的颗粒尺度，直接在世界空间用噪声扰动法线 —— 不需要贴图
vec3 microSurface(vec3 N, vec3 wp, float scale, float strength) {
  if (strength <= 0.0) return N;

  // 一个像素跨过多少个噪声周期。超过约半个周期就采样不足，
  // 相机一动噪点就会来回跳 —— 那正是画面闪烁的来源，这里把它衰减掉。
  float texel = length(fwidth(wp)) * scale;
  float fade = 1.0 - smoothstep(0.30, 0.95, texel);
  if (fade <= 0.001) return N;

  // 两次采样就够：第三个分量由前两者组合，省掉三分之一的哈希
  float a = noise3(wp * scale);
  float b = noise3(wp * scale + 31.7);
  vec3 d = vec3(a, b, (a + b) * 0.5) - 0.5;
  return normalize(N + d * strength * fade);
}

float D_GGX(float NoH, float rough) {
  // 下限放到 0.0022（对应粗糙度 0.047）：喷漆清漆需要这么锐的高光。
  // 输出端有钳制兜底，不会再让极值污染缓冲。
  float a = max(rough * rough, 0.0022);
  float a2 = a * a;
  float d = NoH * NoH * (a2 - 1.0) + 1.0;
  return a2 / (PI * d * d);
}

float V_Smith(float NoV, float NoL, float rough) {
  float a = max(rough * rough, 0.0022);
  float gv = NoL * (NoV * (1.0 - a) + a);
  float gl = NoV * (NoL * (1.0 - a) + a);
  return 0.5 / max(gv + gl, 1e-4);
}

vec3 F_Schlick(vec3 f0, float VoH) {
  return f0 + (1.0 - f0) * pow(1.0 - VoH, 5.0);
}

vec3 lightContribution(
  vec3 N, vec3 V, vec3 L, vec3 lightColor, float intensity,
  float rough, vec3 f0, vec3 albedo
) {
  vec3 H = normalize(L + V);
  float NoL = max(dot(N, L), 0.0);
  float NoV = max(dot(N, V), 1e-4);
  float NoH = max(dot(N, H), 0.0);
  float VoH = max(dot(V, H), 0.0);

  vec3 spec = F_Schlick(f0, VoH) * D_GGX(NoH, rough) * V_Smith(NoV, NoL, rough);
  vec3 diff = albedo / PI;
  return (diff + spec) * lightColor * intensity * NoL;
}

// 薄膜干涉：镜片镀膜那圈青绿转粉紫的反光
vec3 thinFilm(float NoV) {
  float phase = (1.0 - NoV) * 6.5;
  vec3 c = 0.5 + 0.5 * cos(6.2831853 * (phase + vec3(0.0, 0.33, 0.67)));
  return c * c;
}

void main() {
  vec3 N = normalize(vWorldNormal);
  if (!gl_FrontFacing) N = -N;

  N = microSurface(N, vWorldPos, uMicroScale, uMicroStrength);

  vec3 V = normalize(cameraPosition - vWorldPos);
  float NoV = max(dot(N, V), 1e-4);

  vec3 albedo = uBaseColor * (1.0 - uMetalness);
  vec3 f0 = mix(vec3(0.04 * uReflectivity), uBaseColor, uMetalness);

  vec3 color = vec3(0.0);
  color += lightContribution(N, V, uKeyDir, uKeyColor, uKeyIntensity, uRoughness, f0, albedo);

  // 两道又硬又窄的光：曲面边缘那条细高光线全靠它们
  color += lightContribution(N, V, uStreak1Dir, uStreak1Color, 2.1, uRoughness * 0.5, f0, vec3(0.0));
  color += lightContribution(N, V, uStreak2Dir, uStreak2Color, 1.45, uRoughness * 0.55, f0, vec3(0.0));

  // 地平线环境：底面不至于黑成一团
  vec3 ambient = mix(uHorizonDown, uHorizonUp, smoothstep(-0.7, 0.8, N.y)) * uHorizonStrength;
  color += ambient * (albedo + f0 * 0.6);

  vec3 R = reflect(-V, N);
  float fresnel = pow(1.0 - NoV, uFresnelPower);
  color += envSample(R) * mix(f0, vec3(1.0), fresnel) * uReflectivity;

  // 清漆层：真实相机的哑光漆面之上有一层薄光泽，
  // 它产生的小而锐的高光是塑料件不会有的 —— 质感高不高级差在这里
  if (uClearcoat > 0.0) {
    vec3 ccF0 = vec3(0.058);
    color += lightContribution(N, V, uKeyDir, uKeyColor, uKeyIntensity * 0.62, 0.052, ccF0, vec3(0.0)) * uClearcoat;
    color += lightContribution(N, V, uStreak1Dir, uStreak1Color, 1.7, 0.042, ccF0, vec3(0.0)) * uClearcoat;
    color += envSample(R) * ccF0 * (0.45 + pow(1.0 - NoV, 4.5) * 3.2) * uClearcoat;
  }

  // 边缘描边：半透明件靠它读出轮廓，技术透视感就来自这里
  color += uRimColor * pow(1.0 - NoV, uRimPower) * uRimStrength;

  float alpha = uOpacity;

  if (uTransmission > 0.0) {
    float eta = 1.0 / uIor;
    // 三个通道用略微不同的折射率，掠射边缘就出现彩色镶边
    vec3 rr = refract(-V, N, eta * (1.0 - uDispersion));
    vec3 rg = refract(-V, N, eta);
    vec3 rb = refract(-V, N, eta * (1.0 + uDispersion));
    vec3 refracted = vec3(
      envSample(rr).r,
      envSample(rg).g,
      envSample(rb).b
    );

    // 镀膜只在掠射边缘显色，中心保持通透
    float grazing = pow(1.0 - NoV, 1.7);
    refracted += thinFilm(NoV) * uIridescence * grazing * 1.6;

    color = mix(color, color * 0.35 + refracted * uBaseColor, uTransmission * (1.0 - fresnel * 0.65));
    alpha = mix(uOpacity, 1.0, fresnel * 0.8);
  } else if (uIridescence > 0.0) {
    color += thinFilm(NoV) * uIridescence * fresnel;
  }

  // 极端高光值进了 HDR 缓冲，Bloom 降采样时会溢出成 NaN，
  // NaN 一传播整帧就是黑的 —— 拖到镜片正面时的闪屏就是这么来的。
  // max 顺带滤掉负值与部分 NaN，min 封住上限。
  color = min(max(color, vec3(0.0)), vec3(42.0));

  gl_FragColor = vec4(color * uExposure, alpha);
}
`;

// 所有材质共享同一个 uniform 对象，改 .value 就全部生效。
// 曝光作用在 tone mapping 之前，这才是物理正确的顺序。
export const EXPOSURE = { value: 1.25 };

export interface MaterialOptions {
  baseColor: string;
  roughness: number;
  metalness: number;
  reflectivity?: number;
  fresnelPower?: number;
  transmission?: number;
  ior?: number;
  dispersion?: number;
  iridescence?: number;
  opacity?: number;
  clearcoat?: number;
  microStrength?: number;
  microScale?: number;
  rimStrength?: number;
  rimPower?: number;
  rimColor?: string;
  transparent?: boolean;
  side?: THREE.Side;
}

const LIGHTS = {
  keyDir: new THREE.Vector3(0.55, 0.68, 0.48).normalize(),
  keyColor: new THREE.Color('#FFF3E2'),
  keyIntensity: 3.2,

  streak1Dir: new THREE.Vector3(-0.78, 0.36, 0.28).normalize(),
  streak1Color: new THREE.Color('#7FB8FF'),
  streak1Tight: 210,

  streak2Dir: new THREE.Vector3(0.24, -0.5, 0.82).normalize(),
  streak2Color: new THREE.Color('#FFC98A'),
  streak2Tight: 150,

  horizonUp: new THREE.Color('#C6CFD8'),
  horizonDown: new THREE.Color('#8B9299'),
  horizonStrength: 1.12,
};

export function makeMaterial(o: MaterialOptions): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: o.transparent ?? false,
    side: o.side ?? THREE.FrontSide,
    depthWrite: !(o.transparent ?? false),
    uniforms: {
      uBaseColor: { value: new THREE.Color(o.baseColor) },
      uRoughness: { value: o.roughness },
      uMetalness: { value: o.metalness },

      uKeyDir: { value: LIGHTS.keyDir },
      uKeyColor: { value: LIGHTS.keyColor },
      uKeyIntensity: { value: LIGHTS.keyIntensity },

      uStreak1Dir: { value: LIGHTS.streak1Dir },
      uStreak1Color: { value: LIGHTS.streak1Color },
      uStreak1Tight: { value: LIGHTS.streak1Tight },

      uStreak2Dir: { value: LIGHTS.streak2Dir },
      uStreak2Color: { value: LIGHTS.streak2Color },
      uStreak2Tight: { value: LIGHTS.streak2Tight },

      uHorizonUp: { value: LIGHTS.horizonUp },
      uHorizonDown: { value: LIGHTS.horizonDown },
      uHorizonStrength: { value: LIGHTS.horizonStrength },

      uFresnelPower: { value: o.fresnelPower ?? 4.0 },
      uReflectivity: { value: o.reflectivity ?? 1.0 },
      uTransmission: { value: o.transmission ?? 0 },
      uIor: { value: o.ior ?? 1.52 },
      uDispersion: { value: o.dispersion ?? 0 },
      uIridescence: { value: o.iridescence ?? 0 },
      uOpacity: { value: o.opacity ?? 1 },
      uExposure: EXPOSURE,
      uRimStrength: { value: o.rimStrength ?? 0 },
      uRimPower: { value: o.rimPower ?? 3.0 },
      uRimColor: { value: new THREE.Color(o.rimColor ?? '#BFD4E2') },
      uMicroStrength: { value: o.microStrength ?? 0 },
      uMicroScale: { value: o.microScale ?? 62 },
      uClearcoat: { value: o.clearcoat ?? 0 },
    },
  });
}

export const PRESETS: Record<Finish, THREE.ShaderMaterial> = {
  glass: makeMaterial({
    baseColor: '#C6D6DE',
    roughness: 0.04,
    metalness: 0,
    reflectivity: 1.0,
    fresnelPower: 3.2,
    transmission: 0.94,
    ior: 1.62,
    dispersion: 0.055,
    iridescence: 1.05,
    opacity: 0.15,
    transparent: true,
    side: THREE.DoubleSide,
  }),
  metal: makeMaterial({
    baseColor: '#70767D',
    roughness: 0.115,
    clearcoat: 0.45,
    metalness: 1.0,
    reflectivity: 1.0,
    microStrength: 0.045,
    microScale: 168,
    rimStrength: 0.42,
    rimPower: 3.4,
    rimColor: '#1A2027',
  }),
  matte: makeMaterial({
    clearcoat: 0.75,
    baseColor: '#585C62',
    roughness: 0.72,
    metalness: 0.12,
    reflectivity: 0.55,
    microStrength: 0.10,
    microScale: 132,
    rimStrength: 0.7,
    rimPower: 3.6,
  }),
  // 外壳面板：拆解时转半透明做技术透视，组装态实心
  panel: makeMaterial({
    clearcoat: 0.9,
    baseColor: '#474B51',
    roughness: 0.72,
    metalness: 0.12,
    reflectivity: 0.55,
    microStrength: 0.10,
    microScale: 132,
    rimStrength: 0.85,
    rimPower: 2.8,
    rimColor: '#161B21',
    opacity: 0.88,
    transparent: true,
  }),
  blade: makeMaterial({
    clearcoat: 0.4,
    microStrength: 0.07,
    microScale: 145,
    baseColor: '#33373C',
    roughness: 0.86,
    metalness: 0.35,
    reflectivity: 0.4,
  }),
  accent: makeMaterial({
    baseColor: '#9A6A26',
    roughness: 0.19,
    clearcoat: 0.5,
    metalness: 1.0,
    reflectivity: 1.0,
    iridescence: 0.12,
  }),
};
