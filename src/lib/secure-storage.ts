async function getItemAsync(key: string): Promise<string | null> {
  try { return localStorage.getItem(key); } catch { return null; }
}

async function setItemAsync(key: string, value: string): Promise<void> {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

async function deleteItemAsync(key: string): Promise<void> {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export const secureStorage = { getItemAsync, setItemAsync, deleteItemAsync };
