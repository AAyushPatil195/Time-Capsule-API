import app from './app.js';
import { initScheduler } from './utils/scheduler.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize the expiration scheduler
initScheduler();

app.listen(PORT, () => {
  console.log(`Time Capsule API server running on port ${PORT}`);
});