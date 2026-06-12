// Auto-scheduler: runs reminders + enquiry sync on intervals
// This module is imported once on app startup and starts background timers.

let initialized = false;

export function startAutoScheduler() {
  if (initialized) return;
  initialized = true;

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Run reminders every 6 hours
  setInterval(async () => {
    try {
      console.log('[AutoScheduler] Running auto email reminders...');
      await fetch(`${BASE_URL}/api/cron/reminders`);
      console.log('[AutoScheduler] Reminders complete.');
    } catch (err) {
      console.error('[AutoScheduler] Reminder error:', err);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  // Run enquiry sync every 15 minutes
  setInterval(async () => {
    try {
      console.log('[AutoScheduler] Syncing website enquiries...');
      await fetch(`${BASE_URL}/api/sync-enquiries`);
      console.log('[AutoScheduler] Enquiry sync complete.');
    } catch (err) {
      console.error('[AutoScheduler] Enquiry sync error:', err);
    }
  }, 15 * 60 * 1000); // 15 minutes

  // Run Aronium sync every 30 minutes  
  setInterval(async () => {
    try {
      console.log('[AutoScheduler] Syncing Aronium customers...');
      await fetch(`${BASE_URL}/api/sync`);
      console.log('[AutoScheduler] Aronium sync complete.');
    } catch (err) {
      console.error('[AutoScheduler] Aronium sync error:', err);
    }
  }, 30 * 60 * 1000); // 30 minutes

  // Also run all syncs once on startup after a short delay
  setTimeout(async () => {
    try {
      console.log('[AutoScheduler] Initial startup sync...');
      await Promise.allSettled([
        fetch(`${BASE_URL}/api/sync-enquiries`),
        fetch(`${BASE_URL}/api/cron/reminders`),
      ]);
      console.log('[AutoScheduler] Startup sync complete.');
    } catch (err) {
      console.error('[AutoScheduler] Startup sync error:', err);
    }
  }, 10000); // 10 seconds after boot

  console.log('[AutoScheduler] ✅ Background automation started:');
  console.log('  • Email reminders: every 6 hours');
  console.log('  • Website enquiry sync: every 15 minutes');
  console.log('  • Aronium customer sync: every 30 minutes');
}
