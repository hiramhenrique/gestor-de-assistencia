const APP_STORAGE_PREFIX = 'at_';

export interface LocalBackupPayload {
  version: 1;
  app: 'assistencia-tecnica';
  exportedAt: string;
  localStorageData: Record<string, string>;
  sessionStorageData: Record<string, string>;
}

function collectStorageEntries(storage: Storage, prefix: string) {
  const entries: Record<string, string> = {};

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(prefix)) continue;

    const value = storage.getItem(key);
    if (value === null) continue;

    entries[key] = value;
  }

  return entries;
}

function clearStorageByPrefix(storage: Storage, prefix: string) {
  const keysToRemove: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && key.startsWith(prefix)) keysToRemove.push(key);
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

function writeStorageEntries(storage: Storage, entries: Record<string, string>) {
  Object.entries(entries).forEach(([key, value]) => {
    storage.setItem(key, value);
  });
}

export function createLocalBackupPayload(): LocalBackupPayload {
  return {
    version: 1,
    app: 'assistencia-tecnica',
    exportedAt: new Date().toISOString(),
    localStorageData: collectStorageEntries(localStorage, APP_STORAGE_PREFIX),
    sessionStorageData: collectStorageEntries(sessionStorage, APP_STORAGE_PREFIX),
  };
}

export function createLocalBackupJson() {
  return JSON.stringify(createLocalBackupPayload(), null, 2);
}

export function downloadLocalBackup() {
  const json = createLocalBackupJson();
  const dateLabel = new Date().toISOString().slice(0, 10);
  const fileName = `backup-assistencia-${dateLabel}.json`;

  const blob = new Blob([json], { type: 'application/json' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function parseLocalBackupJson(raw: string): LocalBackupPayload {
  const parsed = JSON.parse(raw) as Partial<LocalBackupPayload>;

  if (!parsed || parsed.version !== 1 || parsed.app !== 'assistencia-tecnica') {
    throw new Error('Arquivo de backup inválido para este sistema.');
  }

  if (typeof parsed.localStorageData !== 'object' || typeof parsed.sessionStorageData !== 'object') {
    throw new Error('Estrutura do backup inválida.');
  }

  return {
    version: 1,
    app: 'assistencia-tecnica',
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    localStorageData: parsed.localStorageData || {},
    sessionStorageData: parsed.sessionStorageData || {},
  };
}

export function restoreLocalBackup(payload: LocalBackupPayload) {
  clearStorageByPrefix(localStorage, APP_STORAGE_PREFIX);
  clearStorageByPrefix(sessionStorage, APP_STORAGE_PREFIX);

  writeStorageEntries(localStorage, payload.localStorageData || {});
  writeStorageEntries(sessionStorage, payload.sessionStorageData || {});
}
