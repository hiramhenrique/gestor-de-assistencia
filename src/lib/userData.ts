import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type UserCollectionName = 'clientes' | 'funcionarios' | 'ordens' | 'formularios' | 'orcamentos' | 'estoque' | 'vendas';

const COLLECTION_DEFAULTS: Record<UserCollectionName, string> = {
  clientes: 'clientes',
  funcionarios: 'funcionarios',
  ordens: 'ordens',
  formularios: 'formularios',
  orcamentos: 'orcamentos',
  estoque: 'estoque',
  vendas: 'vendas',
};

const COLLECTION_ENV_KEYS: Record<UserCollectionName, string> = {
  clientes: 'VITE_FIRESTORE_COLLECTION_CLIENTS',
  funcionarios: 'VITE_FIRESTORE_COLLECTION_EMPLOYEES',
  ordens: 'VITE_FIRESTORE_COLLECTION_ORDERS',
  formularios: 'VITE_FIRESTORE_COLLECTION_FORMS',
  orcamentos: 'VITE_FIRESTORE_COLLECTION_QUOTES',
  estoque: 'VITE_FIRESTORE_COLLECTION_STOCK',
  vendas: 'VITE_FIRESTORE_COLLECTION_SALES',
};

function getCollectionName(name: UserCollectionName) {
  return import.meta.env[COLLECTION_ENV_KEYS[name]] || COLLECTION_DEFAULTS[name];
}

function getUserCollectionRef(userId: string, name: UserCollectionName) {
  return collection(db, 'users', userId, getCollectionName(name));
}

export async function loadUserCollection<T extends { id: string }>(userId: string, name: UserCollectionName): Promise<T[]> {
  if (!userId) return [];
  const snapshot = await getDocs(getUserCollectionRef(userId, name));
  return snapshot.docs.map((item) => ({ ...(item.data() as T) }));
}

export async function saveUserCollection<T extends { id: string }>(userId: string, name: UserCollectionName, items: T[]) {
  if (!userId || !Array.isArray(items)) return;

  // Evita apagar a coleção inteira quando a lista local estiver vazia ou incompleta.
  // Em vez disso, salvamos cada documento individualmente e removemos apenas os itens
  // que não existirem mais na lista atual.
  const ref = getUserCollectionRef(userId, name);
  const snapshot = await getDocs(ref);
  const existingIds = new Set(snapshot.docs.map((item) => item.id));
  const nextIds = new Set(items.map((item) => item.id).filter(Boolean));

  if (items.length === 0) return;

  await Promise.all(items.map((item) => setDoc(doc(ref, item.id), item)));

  const staleDocs = snapshot.docs.filter((item) => !nextIds.has(item.id));
  await Promise.all(staleDocs.map((item) => deleteDoc(doc(ref, item.id))));
}

export async function clearUserCollections(userId: string) {
  if (!userId) return;
  await Promise.all((Object.keys(COLLECTION_DEFAULTS) as UserCollectionName[]).map(async (name) => {
    const ref = getUserCollectionRef(userId, name);
    const snapshot = await getDocs(ref);
    await Promise.all(snapshot.docs.map((item) => deleteDoc(doc(ref, item.id))));
  }));
}
