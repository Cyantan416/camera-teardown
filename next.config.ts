import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 纯静态站：导出 HTML/JS/CSS，虚拟主机直接放就能跑
  output: 'export',
  // distDir 必须是固定值。写成 process.env.NODE_ENV 的三元表达式会出事：
  // 导出阶段的 worker 读到的值和 build 阶段不一致，首页根本不会生成 index.html
  distDir: 'dist',
};

export default nextConfig;
