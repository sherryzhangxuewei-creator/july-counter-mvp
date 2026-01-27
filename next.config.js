/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // 启用静态导出
  trailingSlash: true,  // 启用静态导出
  distDir: 'out',  // 指定导出的文件夹名称
}

module.exports = nextConfig;


