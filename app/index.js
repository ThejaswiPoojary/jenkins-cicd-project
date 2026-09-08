const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from the CI/CD demo app!',
    version: process.env.APP_VERSION || 'dev',
    hostname: require('os').hostname()
  });
});

// Health check endpoint - used by Kubernetes liveness/readiness probes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
