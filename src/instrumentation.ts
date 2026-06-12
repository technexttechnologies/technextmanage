export async function register() {
  // Only run on server side
  if (typeof window === 'undefined') {
    // Disabled for Vercel deployment: We now use Vercel Cron (vercel.json) instead of local setInterval
    // const { startAutoScheduler } = await import('./lib/autoScheduler');
    // startAutoScheduler();
  }
}
