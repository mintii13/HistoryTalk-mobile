import type { ChatSession } from './types';

/** Moc thoi gian de sap xep phien chat: tin nhan cuoi → cap nhat → tao. */
export function sessionTime(session: Pick<ChatSession, 'lastMessageAt' | 'updatedAt' | 'createdAt'>) {
  const value = session.lastMessageAt ?? session.updatedAt ?? session.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}
