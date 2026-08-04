import { loadUserCollection, saveUserCollection } from '../../lib/userData';

export type BudgetCategory = 'displays' | 'bateria' | 'conectores' | 'servicos-rapidos' | 'servicos-complexos';

export interface BudgetItem {
  id: string;
  category: BudgetCategory;
  model: string;
  value: number;
  quality: string;
  observations?: string;
}

export const initialBudgetItems: BudgetItem[] = [];

export async function loadOrcamentos(userId?: string): Promise<BudgetItem[]> {
  if (!userId) return initialBudgetItems;
  return loadUserCollection<BudgetItem>(userId, 'orcamentos');
}

export async function saveOrcamentos(userId: string | undefined, items: BudgetItem[]) {
  if (!userId) return;
  return saveUserCollection(userId, 'orcamentos', items);
}
