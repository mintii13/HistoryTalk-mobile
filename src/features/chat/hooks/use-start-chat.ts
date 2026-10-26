import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { getCharacterImageUri, type Character } from '@/features/characters/types';

import { chatApi } from '../api';
import type { ChatSession } from '../types';
import { useCreateSession } from './use-create-session';

function sessionTime(session: ChatSession) {
  const value = session.lastMessageAt ?? session.updatedAt ?? session.createdAt;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

/**
 * Mở cuộc trò chuyện với 1 nhân vật trong 1 bối cảnh: tiếp tục phiên gần nhất
 * nếu đã có, chưa có thì tạo phiên mới — cùng luồng với trang chi tiết nhân vật.
 */
export function useStartChat() {
  const router = useRouter();
  const { mutateAsync: createSession } = useCreateSession();
  const [startingId, setStartingId] = useState<string | null>(null);

  async function startChat(character: Character, contextId: string, contextName: string) {
    if (startingId) return;
    setStartingId(character.id);
    try {
      const existing = await chatApi.getSessions({ characterId: character.id, contextId });
      const latest = existing
        .filter((s) => s.contextId === contextId)
        .sort((a, b) => sessionTime(b) - sessionTime(a))[0];
      const result = latest ? null : await createSession({ characterId: character.id, contextId });
      const session = latest ?? result?.session ?? result;
      if (!session?.id) throw new Error('Missing chat session id');
      router.push({
        pathname: '/chat/[sessionId]',
        params: {
          sessionId: session.id,
          characterId: character.id,
          contextId,
          characterName: character.name,
          characterImageUrl: getCharacterImageUri(character) ?? '',
          characterModelUrl: character.modelUrl ?? '',
          contextName,
          greetingMessage: result?.greetingMessage ? JSON.stringify(result.greetingMessage) : '',
          suggestedQuestions: result?.suggestedQuestions ? JSON.stringify(result.suggestedQuestions) : '',
        },
      });
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? 'Không thể bắt đầu cuộc trò chuyện');
    } finally {
      setStartingId(null);
    }
  }

  return { startChat, startingId };
}
