'use client';

import {
  EffectComposer,
  Bloom,
  ToneMapping,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

// 只在 ?post=1 时动态载入。默认路径不走后期链，
// 静态引入等于让所有人白下载一个用不到的库
export default function PostChain() {
  return (
    <EffectComposer multisampling={0}>
      {/* 阈值明显高于环境光：只让最亮的高光炸开，不是给整个物体罩一层雾 */}
      <Bloom
        luminanceThreshold={1.45}
        luminanceSmoothing={0.45}
        intensity={0.45}
        kernelSize={2}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.26} darkness={0.68} />
      {/* 很淡的柔光颗粒，目的是消色带不是做旧 */}
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.16} />
    </EffectComposer>
  );
}
