import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@write_queue';

async function load() {
  try { return JSON.parse(await AsyncStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

async function save(queue) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(queue)); } catch {}
}

export async function enqueue(item) {
  const q = await load();
  await save([...q, item]);
}

export async function dequeue(id) {
  const q = await load();
  await save(q.filter(i => i.id !== id));
}

export { load as getQueue };
