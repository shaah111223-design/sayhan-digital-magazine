import app, { initDatabaseAndSeed } from './app.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDatabaseAndSeed();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` 👑 YELLOW REIGN ACADEMY - MAGAZINE PUBLISHING PORTAL`);
      console.log(`=======================================================`);
      console.log(` • Server Running: http://localhost:${PORT}`);
      console.log(` • Super Admin: Sayhan`);
      console.log(` • Admin Notification Email: yellowreignacademy@gmail.com`);
      console.log(` • Admin Phone: 9544498843`);
      console.log(` • Database: SQLite (WAL Mode & Foreign Keys Active)`);
      console.log(` • Secure File Storage: uploads/users/:id/submissions/`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
  }
}

startServer();

export default app;
