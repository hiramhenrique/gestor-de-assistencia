export type UserCollectionName = 'clientes' | 'funcionarios' | 'ordens' | 'formularios' | 'orcamentos' | 'estoque' | 'vendas';

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
  localStorage.setItem(getStorageKey(userId, name), JSON.stringify(items));
}

