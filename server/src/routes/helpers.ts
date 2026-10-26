import type { Couple } from '../types';
import { getStore } from '../store';

export async function getCoupleForUser(
  coupleId: string,
  userId: string,
): Promise<Couple | null> {
  const couple = await getStore().getCouple(coupleId);
  if (!couple) return null;
  if (couple.memberA === userId || couple.memberB === userId) return couple;
  return null;
}
