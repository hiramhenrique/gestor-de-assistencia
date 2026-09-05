export type UserCollectionName = 'clientes' | 'funcionarios' | 'ordens' | 'formularios' | 'orcamentos' | 'estoque' | 'vendas';

const USER_DATA_UPDATED_EVENT = 'user-data-updated';

function getStorageKey(userId: string, name: UserCollectionName) {
  return `at_data:${userId}:${name}`;
}

export async function loadUserCollection<T extends { id: string }>(userId: string, name: UserCollectionName): Promise<T[]> {
  if (!userId) return [];

  try {
    const raw = localStorage.getItem(getStorageKey(userId, name));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export async function saveUserCollection<T extends { id: string }>(userId: string, name: UserCollectionName, items: T[]) {
  if (!userId || !Array.isArray(items)) return;

  const key = getStorageKey(userId, name);
  localStorage.setItem(key, JSON.stringify(items));

  window.dispatchEvent(new CustomEvent(USER_DATA_UPDATED_EVENT, {
    detail: { key, userId, name },
  }));
}

export function subscribeUserCollection<T extends { id: string }>(
  userId: string,
  name: UserCollectionName,
  onChange: (items: T[]) => void,
) {
  const key = getStorageKey(userId, name);

  const emitCurrentValue = () => {
    void loadUserCollection<T>(userId, name).then(onChange);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      emitCurrentValue();
    }
  };

  const handleLocalUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<{ key?: string }>;
    if (customEvent.detail?.key === key) {
      emitCurrentValue();
    }
  };

  emitCurrentValue();
  window.addEventListener('storage', handleStorage);
  window.addEventListener(USER_DATA_UPDATED_EVENT, handleLocalUpdate as EventListener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(USER_DATA_UPDATED_EVENT, handleLocalUpdate as EventListener);
  };
}

