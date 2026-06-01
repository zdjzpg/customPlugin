const fs = require('node:fs');
const path = require('node:path');

assertSupportedNodeVersion();

const { bootstrapApplication } = require('./bootstrap.cjs');
const { loadConfig, loadEnvFile } = require('./config.cjs');

loadEnvFile();
const config = loadConfig();
ensureDataDirectory();

const app = bootstrapApplication(config);

app.listen(config.port, () => {
  console.log(`pdf-converter-web listening on http://127.0.0.1:${config.port}`);
});

function ensureDataDirectory() {
  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
}

function assertSupportedNodeVersion() {
  const majorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (majorVersion >= 24) {
    return;
  }

  throw new Error(
    `pdf-converter-web requires Node 24+, current version is ${process.versions.node}`
  );
}
