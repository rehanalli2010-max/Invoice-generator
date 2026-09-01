module.exports = {
  apps: [
    {
      name: 'invoice-app',
      script: './server/server-unified.js',
      watch: false,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000
      }
    }
  ]
};
