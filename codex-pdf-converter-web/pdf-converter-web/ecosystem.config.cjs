module.exports = {
  apps: [
    {
      name: 'pdf-converter-web',
      script: 'server/index.cjs',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3015'
      }
    }
  ]
};
