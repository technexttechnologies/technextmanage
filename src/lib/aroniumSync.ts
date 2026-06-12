// We use the standalone aronium-sync-agent.js instead of direct SQLite connections on Vercel.
// These functions are stubbed to prevent Next.js build errors related to the 'sqlite3' native module.

export async function syncCustomersFromAronium() {
  console.log("Use the standalone Aronium Sync Agent instead of this cloud function.");
  return { added: 0, updated: 0 };
}

export async function insertCustomerToAronium(name: string, phone: string, email: string) {
  console.log("Use the standalone Aronium Sync Agent instead of this cloud function.");
  return false;
}

