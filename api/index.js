import app, { initDatabaseAndSeed } from '../server/app.js';

let isInitialized = false;

export default async function handler(req, res) {
  if (!isInitialized) {
    await initDatabaseAndSeed();
    isInitialized = true;
  }
  return app(req, res);
}
