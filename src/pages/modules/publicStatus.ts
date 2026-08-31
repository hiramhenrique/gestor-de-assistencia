import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { OrderStatus } from './ordersData';

export const statusSequence: OrderStatus[] = ['Em análise', 'Aguardando aprovação', 'Aguardando peça', 'Em andamento', 'Concluída'];

export interface PublicOrderStatusData {
  orderId: string;
  client: string;
  device: string;
  phone: string;
  status: OrderStatus;
  updatedAt: string;
  shareUrl: string;
}

const PUBLIC_STATUS_COLLECTION = 'public-status';

export function buildPublicStatusUrl(orderId: string): string {
  if (typeof window === 'undefined' || !orderId) return '';
  const url = new URL('/status', window.location.origin);
  url.searchParams.set('os', orderId);
  return url.toString();
}

export async function readPublicStatus(orderId: string): Promise<PublicOrderStatusData | null> {
  if (!orderId) return null;

  try {
    const ref = doc(db, PUBLIC_STATUS_COLLECTION, orderId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;

    return snapshot.data() as PublicOrderStatusData;
  } catch (error) {
    console.error('Erro ao ler status público:', error);
    return null;
  }
}

export function subscribeToPublicStatus(orderId: string, onChange: (data: PublicOrderStatusData | null) => void) {
  if (!orderId) {
    onChange(null);
    return () => undefined;
  }

  const ref = doc(db, PUBLIC_STATUS_COLLECTION, orderId);
  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }

    onChange(snapshot.data() as PublicOrderStatusData);
  }, (error) => {
    console.error('Erro ao acompanhar status público:', error);
    onChange(null);
  });
}

export async function savePublicStatus(data: PublicOrderStatusData) {
  const ref = doc(db, PUBLIC_STATUS_COLLECTION, data.orderId);
  try {
    await setDoc(ref, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao salvar status público:', error);
    throw error;
  }
}

export async function removePublicStatus(orderId: string) {
  if (!orderId) return;
  const ref = doc(db, PUBLIC_STATUS_COLLECTION, orderId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    console.error('Erro ao remover status público:', error);
  }
}
