module.exports = {
  input: 'src/pages',
  output: 'dist',
  port: 8000,
  mode: 'prod',
  external: {
    antd: {
      js: 'https://cdn.bootcdn.net/ajax/libs/antd/4.7.0/antd.min.js',
      css: 'https://cdn.bootcdn.net/ajax/libs/antd/4.7.0/antd.min.css'
    }
  }
}

// 1. 入口 index.tsx

// 2. 出口 dist

