import { exec } from 'child_process';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: npmVersion } = require('../../package.json');
const version = new Promise((resolve) =>
  exec('git rev-parse --short HEAD', (error, stdout, stderr) => {
    resolve(stdout.trim());
  })
);

export const versionHeaderMiddleware = async (req, res, next): Promise<void> => {
  const gitVersion = await version;
  res.set('X-Version', npmVersion + ' (' + gitVersion + ')');
  next();
};
