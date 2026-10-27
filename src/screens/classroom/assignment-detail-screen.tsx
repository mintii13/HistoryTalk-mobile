import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpenText, CheckCircle2, ClipboardCheck, MessageCircle, Send, ShieldCheck } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DueLine,
  EmptyState,
  ListSkeleton,
  Pill,
  ScoreChip,
  ScreenHeader,
  TypeTile,
  studentStyles,
} from '@/components/student/student-ui';
import { Text } from '@/components/ui/text';
import { BORDER, CARD, GREEN, MUTED, ORANGE, RED, TEXT, TEXT2 } from '@/constants/palette';
import { useStartAssignment, useStudentAssignment, useSubmitAssignment } from '@/features/assignments/hooks';
import {
  ASSIGNMENT_TYPE_META,
  formatDateTime,
  formatScore,
  isDone,
  requirementText,
  statusBadge,
} from '@/features/assignments/meta';
import type { StudentAssignment } from '@/features/assignments/types';
import { characterApi } from '@/features/characters/api';
import { primaryContext } from '@/features/characters/types';
import { chatApi } from '@/features/chat/api';
import { useStartChat } from '@/features/chat/hooks/use-start-chat';
import { localContentApi } from '@/features/local-contents/api';
import { quizApi } from '@/features/quiz/api';
import { useStartQuiz } from '@/features/quiz/hooks/use-start-quiz';
import { clearQuizProgress } from '@/features/quiz/progress-storage';
import { ApiError } from '@/lib/api-client';

const time = (v?: string | null) => (v ? new Date(v).getTime() || 0 : 0);

/** Bang chung de nop: lan lam quiz / phien chat moi nhat voi noi dung duoc giao (giong web). */
function useEvidence(a: StudentAssignment | undefined) {
  const quiz = useQuery({
    queryKey: ['assignments', 'evidence', 'quiz', a?.targetId],
    queryFn: async () => {
      const page = await quizApi.getMyResults(0, 50);
      return (page?.content ?? [])
        .filter((r) => r.quizId === a!.targetId && r.completedAt)
        .sort((x, y) => time(y.completedAt) - time(x.completedAt))[0] ?? null;
    },
    enabled: a?.assignmentType === 'QUIZ_TEST',
  });
  const chat = useQuery({
    queryKey: ['assignments', 'evidence', 'chat', a?.targetId],
    queryFn: async () => {
      const sessions = await chatApi.getSessions({ characterId: a!.targetId });
      return sessions
        .filter((s) => s.characterId === a!.targetId || !s.characterId)
        .sort((x, y) => time(y.lastMessageAt ?? y.updatedAt) - time(x.lastMessageAt ?? x.updatedAt))[0] ?? null;
    },
    enabled: a?.assignmentType === 'AI_CHAT_ROLEPLAY',
  });
  return { quiz, chat };
}

/** Lam 1 bai tap — ban mobile cua web /assignments/[id]. */
export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: a, isLoading, error, refetch, isRefetching } = useStudentAssignment(id);
  const evidence = useEvidence(a);
  const start = useStartAssignment();
  const submit = useSubmitAssignment();
  const startQuiz = useStartQuiz();
  const { startChat, startingId } = useStartChat();
  const [opening, setOpening] = useState(false);

  // Quay lai tu man doc / chat / quiz: tai lai trang thai va bang chung.
  useFocusEffect(
    useCallback(() => {
      void refetch();
      void evidence.quiz.refetch();
      void evidence.chat.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScreenHeader title="Bài tập" />
        <ListSkeleton count={3} height={120} />
      </SafeAreaView>
    );
  }

  if (!a) {
    const notFound = error instanceof ApiError && (error.status === 403 || error.status === 404);
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <ScreenHeader title="Bài tập" />
        <EmptyState
          title={notFound ? 'Không tìm thấy bài tập' : 'Không tải được bài tập'}
          description={notFound ? 'Bài tập không tồn tại hoặc không được giao cho bạn.' : error?.message}
          action={notFound
            ? { label: 'Về danh sách bài tập', onPress: () => router.replace('/assignments' as never) }
            : { label: 'Thử lại', onPress: () => void refetch() }}
        />
      </SafeAreaView>
    );
  }

  const assignment = a;
  const meta = ASSIGNMENT_TYPE_META[assignment.assignmentType];
  const badge = statusBadge(assignment);
  const requirement = requirementText(assignment);
  const settled = isDone(assignment.submissionStatus) || assignment.submissionStatus === 'EXEMPTED';
  const late = assignment.expired || assignment.submissionStatus === 'MISSED';
  const busy = start.isPending || submit.isPending || startQuiz.isPending || opening || !!startingId;

  async function ensureStarted() {
    if (assignment.submissionStatus !== 'NOT_STARTED') return true;
    try {
      await start.mutateAsync(assignment.assignmentId);
      return true;
    } catch (e: any) {
      Alert.alert('Không bắt đầu được bài', e?.message ?? 'Vui lòng thử lại.');
      return false;
    }
  }

  function doSubmit(payload: { quizSessionId?: string; chatSessionId?: string } = {}) {
    submit.mutate(
      { assignmentId: assignment.assignmentId, payload },
      {
        onSuccess: (res) => {
          const title = res.status === 'LATE_SUBMITTED' ? 'Đã nộp muộn' : 'Đã nộp bài';
          const scoreText = formatScore(res.score);
          Alert.alert(title, scoreText ? `Điểm của bạn: ${scoreText}.` : 'Thầy cô sẽ xem bài của bạn.');
        },
        onError: (e) => Alert.alert('Chưa nộp được bài', e.message),
      },
    );
  }

  async function openReading() {
    setOpening(true);
    try {
      if (!(await ensureStarted())) return;
      // Boi canh rieng cua truong/lop neu co, khong thi la su kien trong thu vien HistoryTalk.
      const local = await localContentApi.getById('CONTEXT', assignment.targetId).catch(() => null);
      router.push((local ? `/classes/materials/context/${assignment.targetId}` : `/context/${assignment.targetId}`) as never);
    } finally {
      setOpening(false);
    }
  }

  async function openChat() {
    setOpening(true);
    try {
      if (!(await ensureStarted())) return;
      const character = await characterApi.getById(assignment.targetId);
      const ctx = primaryContext(character);
      if (!ctx) {
        Alert.alert('Chưa trò chuyện được', 'Nhân vật này chưa gắn với bối cảnh lịch sử nào. Hãy báo thầy cô nhé.');
        return;
      }
      await startChat(character, ctx.id, ctx.name);
    } catch (e: any) {
      Alert.alert('Không mở được cuộc trò chuyện', e?.message ?? 'Vui lòng thử lại.');
    } finally {
      setOpening(false);
    }
  }

  async function openQuiz() {
    if (!(await ensureStarted())) return;
    try {
      await clearQuizProgress(assignment.targetId);
      const quiz = await quizApi.getById(assignment.targetId).catch(() => null);
      await startQuiz.mutateAsync({
        quizId: assignment.targetId,
        limitedTime: quiz?.durationSeconds || undefined,
        assignmentId: assignment.assignmentId,
      });
      router.push('/quiz/play');
    } catch (e: any) {
      Alert.alert('Không bắt đầu được bài kiểm tra', e?.message ?? 'Vui lòng thử lại.');
    }
  }

  const started = assignment.submissionStatus !== 'NOT_STARTED';
  const prevQuiz = evidence.quiz.data;
  const chatSession = evidence.chat.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <ScreenHeader title={meta.label} />
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={ORANGE} />}
      >
        <View style={s.panel}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TypeTile type={assignment.assignmentType} size={48} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                <Pill label={meta.label} color={TEXT2} />
                <Pill label={badge.label} tone={badge.tone} />
              </View>
            </View>
            <ScoreChip score={assignment.score} large />
          </View>
          <Text style={s.title}>{assignment.title}</Text>
          <Text style={s.meta}>Lớp {assignment.className} · {assignment.targetTitle ?? 'Không rõ nội dung'}</Text>
          <DueLine assignment={assignment} />
          {requirement ? <Text style={s.meta}>Yêu cầu: {requirement}</Text> : null}
          {assignment.readingDurationSeconds ? (
            <Text style={s.meta}>Thời gian đọc: {Math.round(assignment.readingDurationSeconds / 60)} phút</Text>
          ) : null}
          {assignment.messageCount ? <Text style={s.meta}>Tin nhắn đã tính: {assignment.messageCount}</Text> : null}
        </View>

        {assignment.description ? (
          <View style={s.note}>
            <Text style={s.noteLabel}>Lời dặn của thầy cô</Text>
            <Text style={s.noteText}>{assignment.description}</Text>
          </View>
        ) : null}

        {assignment.submissionStatus === 'EXEMPTED' ? (
          <View style={[s.notice, { borderColor: `${MUTED}55` }]}>
            <ShieldCheck size={20} color={MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={s.noticeTitle}>Bạn được miễn bài này</Text>
              <Text style={s.noticeText}>Thầy cô đã miễn bài tập này cho bạn, không cần nộp.</Text>
            </View>
          </View>
        ) : isDone(assignment.submissionStatus) ? (
          <View style={[s.notice, { borderColor: `${GREEN}55`, backgroundColor: `${GREEN}10` }]}>
            <CheckCircle2 size={20} color={GREEN} />
            <View style={{ flex: 1 }}>
              <Text style={[s.noticeTitle, { color: GREEN }]}>
                {assignment.submissionStatus === 'LATE_SUBMITTED' ? 'Đã nộp muộn' : 'Đã nộp bài'}
              </Text>
              <Text style={s.noticeText}>
                Nộp lúc {formatDateTime(assignment.submittedAt)}
                {formatScore(assignment.score) ? ` · Điểm ${formatScore(assignment.score)}` : ''}. Bài đã nộp không thể nộp lại.
              </Text>
            </View>
          </View>
        ) : null}

        {!settled ? (
          <View style={{ gap: 10 }}>
            {late ? <Text style={s.late}>Đã quá hạn: bài nộp bây giờ sẽ tính là nộp muộn.</Text> : null}

            {assignment.assignmentType === 'CONTEXT_READING' ? (
              started ? (
                <>
                  <Text style={studentStyles.hint}>
                    Bạn bắt đầu đọc lúc {formatDateTime(assignment.startedAt)}. Đọc xong thì bấm “Nộp bài”.
                  </Text>
                  <ActionButton label="Nộp bài" icon={Send} onPress={() => doSubmit({})} loading={submit.isPending} disabled={busy} />
                  <ActionButton label="Mở lại bối cảnh" icon={BookOpenText} secondary onPress={() => void openReading()} disabled={busy} />
                </>
              ) : (
                <>
                  <Text style={studentStyles.hint}>
                    Thời gian đọc tính từ lúc bấm “Bắt đầu đọc” đến lúc nộp{requirement ? `; cần ${requirement}` : ''}.
                  </Text>
                  <ActionButton label="Bắt đầu đọc" icon={BookOpenText} onPress={() => void openReading()} loading={opening} disabled={busy} />
                </>
              )
            ) : null}

            {assignment.assignmentType === 'AI_CHAT_ROLEPLAY' ? (
              <>
                <Text style={studentStyles.hint}>
                  Trò chuyện với {assignment.targetTitle ?? 'nhân vật'} rồi quay lại nộp bài.
                  {requirement ? ` Cần ${requirement} để được 10 điểm.` : ''}
                </Text>
                {started && chatSession ? (
                  <>
                    <ActionButton
                      label={`Nộp bài (${chatSession.messageCount ?? 0} tin nhắn)`}
                      icon={Send}
                      onPress={() => doSubmit({ chatSessionId: chatSession.id })}
                      loading={submit.isPending}
                      disabled={busy}
                    />
                    <ActionButton label="Tiếp tục trò chuyện" icon={MessageCircle} secondary onPress={() => void openChat()} disabled={busy} />
                  </>
                ) : (
                  <ActionButton
                    label={started ? 'Tiếp tục trò chuyện' : 'Bắt đầu trò chuyện'}
                    icon={MessageCircle}
                    onPress={() => void openChat()}
                    loading={opening || !!startingId}
                    disabled={busy}
                  />
                )}
              </>
            ) : null}

            {assignment.assignmentType === 'QUIZ_TEST' ? (
              <>
                <Text style={studentStyles.hint}>
                  Làm xong và bấm nộp là bài được nộp luôn. Điểm = số câu đúng / tổng số câu × 10.
                </Text>
                <ActionButton
                  label={started ? 'Làm bài' : 'Bắt đầu làm bài'}
                  icon={ClipboardCheck}
                  onPress={() => void openQuiz()}
                  loading={startQuiz.isPending || start.isPending}
                  disabled={busy}
                />
                {prevQuiz ? (
                  <ActionButton
                    label={`Nộp lần làm trước (${prevQuiz.score}/${prevQuiz.totalQuestions} câu đúng)`}
                    icon={Send}
                    secondary
                    onPress={() => doSubmit({ quizSessionId: prevQuiz.sessionId })}
                    loading={submit.isPending}
                    disabled={busy}
                  />
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({ label, icon: Icon, onPress, loading, disabled, secondary }: {
  label: string;
  icon: typeof Send;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[secondary ? studentStyles.secondaryBtn : studentStyles.primaryBtn, disabled && !loading && { opacity: 0.6 }]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? ORANGE : '#fff'} />
      ) : (
        <>
          <Icon size={18} color={secondary ? TEXT : '#fff'} />
          <Text style={secondary ? studentStyles.secondaryBtnText : studentStyles.primaryBtnText}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  panel: { backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 16, gap: 6 },
  title: { color: TEXT, fontSize: 20, fontWeight: '900', marginTop: 6, lineHeight: 26 },
  meta: { color: MUTED, fontSize: 13 },
  note: { backgroundColor: CARD, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: ORANGE, padding: 14, gap: 6 },
  noteLabel: { color: TEXT, fontSize: 13, fontWeight: '800' },
  noteText: { color: TEXT2, fontSize: 14, lineHeight: 21 },
  notice: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 10, padding: 14, backgroundColor: CARD },
  noticeTitle: { color: TEXT, fontSize: 15, fontWeight: '800' },
  noticeText: { color: TEXT2, fontSize: 13, lineHeight: 19, marginTop: 2 },
  late: { color: RED, fontSize: 13, fontWeight: '700' },
});
