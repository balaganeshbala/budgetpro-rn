import AsyncStorage from '@react-native-async-storage/async-storage';

const txKey = (month, year) => `@cache_tx_${year}_${month}`;
const majorKey = (year) => `@cache_major_${year}`;
const GOALS_KEY = '@cache_goals';
const RECURRING_KEY = '@cache_recurring';
const SUMMARIES_KEY = '@cache_summaries';

async function save(key, data) {
  try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
}

async function load(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

export const offlineCache = {
  saveTransactions: (month, year, data) => save(txKey(month, year), data),
  loadTransactions: (month, year) => load(txKey(month, year)),
  saveGoals: (data) => save(GOALS_KEY, data),
  loadGoals: () => load(GOALS_KEY),
  saveRecurring: (data) => save(RECURRING_KEY, data),
  loadRecurring: () => load(RECURRING_KEY),
  saveMajorExpenses: (year, data) => save(majorKey(year), data),
  loadMajorExpenses: (year) => load(majorKey(year)),
  saveSummaries: (data) => save(SUMMARIES_KEY, data),
  loadSummaries: () => load(SUMMARIES_KEY),
};
