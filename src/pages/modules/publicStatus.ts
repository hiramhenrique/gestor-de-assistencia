import { deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { OrderStatus } from './ordersData';

export const statusSequence: OrderStatus[] = ['Em análise', 'Aguardando aprovação', 'Aguardando peça', 'Em andamento', 'Concluída'];

export interface PublicOrderStatusData {
  statusId?: string;
  orderId: string;
  client: string;
  device: string;
  phone: string;
  status: OrderStatus;
  updatedAt: string;
  shareUrl: string;
}

const PUBLIC_STATUS_COLLECTION = 'public-status';

function getPublicStatusDocId(statusId: string) {
  return statusId;
}

export function buildPublicStatusUrl(statusId: string, orderId?: string): string {
  if (typeof window === 'undefined' || !statusId) return '';
  const url = new URL('/status', window.location.origin);
  url.searchParams.set('track', statusId);
  if (orderId) {
    url.searchParams.set('os', orderId);
  }
  return url.toString();
}

export async function readPublicStatus(statusId: string): Promise<PublicOrderStatusData | null> {
  if (!statusId) return null;

  try {
    const ref = doc(db, PUBLIC_STATUS_COLLECTION, getPublicStatusDocId(statusId));
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;

    return snapshot.data() as PublicOrderStatusData;
  } catch (error) {
    console.error('Erro ao ler status público:', error);
    return null;
  }
}

export function subscribeToPublicStatus(statusId: string, onChange: (data: PublicOrderStatusData | null) => void) {
  if (!statusId) {
    onChange(null);
    return () => undefined;
  }

  const ref = doc(db, PUBLIC_STATUS_COLLECTION, getPublicStatusDocId(statusId));
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
  const docId = getPublicStatusDocId(data.statusId || data.orderId);
  const ref = doc(db, PUBLIC_STATUS_COLLECTION, docId);
  try {
    await setDoc(ref, {
      ...data,
      statusId: data.statusId || data.orderId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao salvar status público:', error);
    throw error;
  }
}

export async function removePublicStatus(statusId: string) {
  if (!statusId) return;
  const ref = doc(db, PUBLIC_STATUS_COLLECTION, getPublicStatusDocId(statusId));
  try {
    await deleteDoc(ref);
  } catch (error) {
    console.error('Erro ao remover status público:', error);
  }
}
