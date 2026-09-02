import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 纯静态站：导出到 out/，Vercel 和任何静态主机都能直接用。
  // 不要设自定义 distDir —— Vercel 的 Next.js 预设认的是默认位置，
  // 而且写成 NODE_ENV 三元表达式还会让首页不生成 index.html
  output: 'export',
};

export default nextConfig;
