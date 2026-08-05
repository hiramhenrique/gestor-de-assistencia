export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  address: string;
  notes: string;
}

import { loadUserCollection, saveUserCollection } from '../../lib/userData';

export const initialClients: ClientRecord[] = [];

export async function loadClients(userId?: string): Promise<ClientRecord[]> {
  if (!userId) return initialClients;
  return loadUserCollection<ClientRecord>(userId, 'clientes');
}

export async function saveClients(userId: string | undefined, clients: ClientRecord[]) {
  if (!userId) return;
  return saveUserCollection(userId, 'clientes', clients);
}
