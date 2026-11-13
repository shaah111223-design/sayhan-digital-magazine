import app, { initDatabaseAndSeed } from '../server/app.js';
import { spawn } from 'node:child_process';

async function main() {
  await initDatabaseAndSeed();
  const server = app.listen(5000, async () => {
    console.log('Test server started on http://localhost:5000');
    try {
      // Run auth_and_system.test.js
      console.log('\n>>> RUNNING AUTH & SECURITY TESTS <<<');
      await runSubprocess('node', ['tests/auth_and_system.test.js']);

      // Run e2e.test.js
      console.log('\n>>> RUNNING E2E TESTS <<<');
      await runSubprocess('node', ['tests/e2e.test.js']);

      console.log('\n>>> ALL TEST SUITES PASSED PERFECTLY! <<<');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('\n❌ Test suite failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

function runSubprocess(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
  });
}

main();

