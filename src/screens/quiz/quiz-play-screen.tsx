import { useRouter } from 'expo-router';
import { AlertCircle, Bookmark } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Mascot } from '@/components/mascot/mascot';
import { QuestionInput } from '@/components/quiz/question-input';
import { Text } from '@/components/ui/text';
import {
  BG,
  BORDER,
  CARD,
  GREEN,
  MUTED,
  ORANGE,
  ORANGE_TINT_FAINT,
  RED,
  TEXT,
  TEXT2,
} from '@/constants/palette';
import { useSubmitAssignment } from '@/features/assignments/hooks';
import { useSubmitQuiz } from '@/features/quiz/hooks/use-submit-quiz';
import { clearQuizProgress, loadQuizProgress, saveQuizProgress } from '@/features/quiz/progress-storage';
import {
  describeCorrectAnswer,
  gradeAnswer,
  hasAnswerKey,
  isAnswerComplete,
  toAnswerPayload,
} from '@/features/quiz/question-data';
import { useQuizStore } from '@/features/quiz/store';

function formatTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function QuizPlayScreen() {
  const router     = useRouter();
  const active     = useQuizStore((s) => s.active);
  const setAnswer  = useQuizStore((s) => s.setAnswer);
  const setElapsed = useQuizStore((s) => s.setElapsed);

  const insets     = useSafeAreaInsets();
  const { mutateAsync: submitQuiz, isPending: submittingQuiz } = useSubmitQuiz();
  const { mutateAsync: submitAssignment, isPending: submittingAssignment } = useSubmitAssignment();
  const submitting = submittingQuiz || submittingAssignment;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(active?.session.limitedTime ?? 0);
  const [exitConfirmVisible,   setExitConfirmVisible]   = useState(false);
  const [submitConfirmVisible, setSubmitConfirmVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Cau nguoi dung tu danh dau de quay lai xem truoc khi nop bai (khong gui len server).
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => new Set());

  function toggleFlag(questionId: string) {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  // Track elapsed with a ref so the interval closure never goes stale
  const elapsedRef       = useRef(0);
  const submittingRef    = useRef(false);
  const timedOutRef      = useRef(false);
  const timeoutRetryRef  = useRef(0);
  // Goi lai doSubmit tu setTimeout ma khong tu tham chieu trong chinh useCallback.
  const retrySubmitRef   = useRef<() => void>(() => {});

  const questions     = active?.session.questions ?? [];
  const userAnswers   = active?.userAnswers ?? {};
  const totalQ        = questions.length;
  const answeredCount = questions.filter((q) => isAnswerComplete(q, userAnswers[q.questionId])).length;

  // Animated progress bar
  const [progressAnim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: totalQ > 0 ? answeredCount / totalQ : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [answeredCount, progressAnim, totalQ]);

  // Submit — reads fresh state from Zustand to avoid stale closure
  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    const snap = useQuizStore.getState().active;
    if (!snap) return;

    const answers = snap.session.questions
      .filter((q) => isAnswerComplete(q, snap.userAnswers[q.questionId]))
      .map((q) => ({
        questionId: q.questionId,
        answerData: toAnswerPayload(q, snap.userAnswers[q.questionId]!),
      }));
    const assignmentId = snap.assignmentId;

    try {
      await submitQuiz({ sessionId: snap.session.sessionId, answers });
      await clearQuizProgress(snap.session.quizId);
    } catch (e: any) {
      submittingRef.current = false;
      // When triggered by timeout: silently retry up to 3 times before showing error
      if (timedOutRef.current && timeoutRetryRef.current < 3) {
        timeoutRetryRef.current += 1;
        setTimeout(() => retrySubmitRef.current(), 2000);
      } else {
        setErrorMessage(e?.message ?? 'Không thể nộp bài. Thử lại?');
      }
      return;
    }

    // Bai tap kieu QUIZ_TEST: nop quiz xong thi nop luon bai tap bang quizSessionId.
    if (assignmentId) {
      try {
        await submitAssignment({ assignmentId, payload: { quizSessionId: snap.session.sessionId } });
      } catch {
        setErrorMessage('Đã lưu bài làm nhưng chưa nộp được bài tập. Mở lại bài tập và bấm "Nộp lần làm trước" để thử lại.');
        router.replace(`/assignments/${assignmentId}`);
        return;
      }
      router.replace(`/assignments/${assignmentId}`);
      return;
    }
    router.replace(`/quiz/result?sessionId=${snap.session.sessionId}`);
  }, [submitQuiz, submitAssignment, router]);

  useEffect(() => {
    retrySubmitRef.current = () => void doSubmit();
  }, [doSubmit]);

  // Countdown timer — only runs when there is an actual time limit
  useEffect(() => {
    if (!active) return;
    const duration = active.session.limitedTime;
    if (!duration) return;   // 0 = no limit, skip entirely

    elapsedRef.current = 0;
    timedOutRef.current = false;
    timeoutRetryRef.current = 0;

    const interval = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      const remaining = Math.max(0, duration - elapsedRef.current);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        timedOutRef.current = true;
        void doSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.session.sessionId]);

  // Neu session hien tai la khoi phuc tu tien trinh da luu (QuizDetailScreen →
  // restoreQuiz), lay lai flaggedIds/currentIdx tuong ung tu AsyncStorage.
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void loadQuizProgress(active.session.quizId).then((saved) => {
      if (cancelled || !saved || saved.session.sessionId !== active.session.sessionId) return;
      setFlaggedIds(new Set(saved.flaggedIds));
      setCurrentIdx(Math.min(saved.currentIdx, Math.max(active.session.questions.length - 1, 0)));
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.session.sessionId]);

  // Tu dong luu tam tien trinh moi khi tra loi / danh dau / chuyen cau, de
  // nguoi dung co the tiep tuc neu thoat giua chung (xem QuizDetailScreen).
  useEffect(() => {
    if (!active) return;
    void saveQuizProgress({
      session: active.session,
      userAnswers,
      elapsedSeconds: elapsedRef.current,
      flaggedIds: Array.from(flaggedIds),
      currentIdx,
      practiceMode: active.practiceMode,
      savedAt: Date.now(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAnswers, flaggedIds, currentIdx]);

  function handleSubmitPress() {
    if (answeredCount < totalQ) {
      setSubmitConfirmVisible(true);
    } else {
      void doSubmit();
    }
  }

  // No active session guard
  if (!active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <AlertCircle size={40} color={MUTED} strokeWidth={1.5} />
        <Text style={{ color: MUTED }}>Không có bài quiz đang chạy</Text>
        <TouchableOpacity onPress={() => router.replace('/quiz')} style={s.pill}>
          <Text style={{ color: ORANGE }}>← Về danh sách quiz</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const question     = questions[currentIdx];
  const selected     = question ? userAnswers[question.questionId] : undefined;
  const isLast       = currentIdx === totalQ - 1;
  const hasTimeLimit = (active.session.limitedTime ?? 0) > 0;
  const timerWarning = hasTimeLimit && timeLeft <= 60;
  // Che do luyen tap: lo dap an ngay khi da chon (chi khi BE tra kem dap an, giong web).
  const revealed        = !!question && active.practiceMode && question.questionType === 'MULTIPLE_CHOICE'
    && hasAnswerKey(question) && isAnswerComplete(question, selected);
  const isAnswerCorrect = revealed && gradeAnswer(question, selected);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'bottom']}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => setExitConfirmVisible(true)} style={s.exitBtn}>
          <Text style={{ color: TEXT2, fontSize: 13, fontWeight: '600' }}>✕ Thoát</Text>
        </TouchableOpacity>

        <View style={[s.timer, timerWarning && s.timerWarn]}>
          {/* Giong QuizProgressBar ben web: mascot hoang khi con duoi 1 phut. */}
          <Mascot mood={timerWarning ? 'timeout' : 'idle'} size={18} arms={false} />
          <Text style={[s.timerText, timerWarning && { color: RED }]}>
            {hasTimeLimit ? formatTime(timeLeft) : '∞'}
          </Text>
        </View>

        <Text style={{ color: MUTED, fontSize: 13, fontWeight: '600' }}>
          {answeredCount}/{totalQ}
        </Text>
      </View>

      {active.practiceMode && (
        <View style={s.practiceBadgeWrap}>
          <View style={s.practiceBadge}>
            <Text style={s.practiceBadgeText}>Chế độ luyện tập</Text>
          </View>
        </View>
      )}

      {/* Progress bar */}
      <View style={s.progressTrack}>
        <Animated.View
          style={[s.progressFill, {
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }]}
        />
      </View>

      {/* ── Question ───────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 110 + insets.bottom }}
      >
        <View style={s.qCounterRow}>
          <View style={{ width: 32 }} />
          <Text style={[s.qCounter, { flex: 1, marginBottom: 0 }]}>Câu {currentIdx + 1} / {totalQ}</Text>
          <TouchableOpacity
            onPress={() => question && toggleFlag(question.questionId)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={s.flagBtn}
          >
            <Bookmark
              size={18}
              color={question && flaggedIds.has(question.questionId) ? ORANGE : MUTED}
              fill={question && flaggedIds.has(question.questionId) ? ORANGE : 'transparent'}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        <View style={s.questionCard}>
          <Text style={s.questionText}>{question?.content}</Text>
        </View>

        {active.practiceMode && revealed && question && (
          <View style={[s.feedbackBanner, isAnswerCorrect ? s.feedbackCorrect : s.feedbackWrong]}>
            <Mascot mood={isAnswerCorrect ? 'happy' : 'sad'} size={30} arms={false} />
            <Text style={[s.feedbackText, { color: isAnswerCorrect ? GREEN : RED }]}>
              {isAnswerCorrect ? 'Chính xác!' : `Sai rồi — đáp án đúng là ${describeCorrectAnswer(question)}`}
            </Text>
          </View>
        )}

        {question ? (
          <QuestionInput
            key={question.questionId}
            question={question}
            answer={selected}
            onAnswer={(a) => setAnswer(question.questionId, a)}
            revealed={revealed}
          />
        ) : null}

        {revealed && question?.explanation && (
          <View style={s.explanationBox}>
            <Text style={s.explanationLabel}>Giải thích</Text>
            <Text style={s.explanationText}>{question.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Footer nav ─────────────────────────────────────────── */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
          activeOpacity={0.7}
          style={[s.navBtn, currentIdx === 0 && { opacity: 0.3 }]}
        >
          <Text style={{ color: TEXT, fontWeight: '700' }}>‹ Trước</Text>
        </TouchableOpacity>

        {/* Dot pager */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxWidth: 160 }}
          contentContainerStyle={{ gap: 5, alignItems: 'center', paddingHorizontal: 4 }}
        >
          {questions.map((q, i) => {
            const isAns = isAnswerComplete(q, userAnswers[q.questionId]);
            const isCur = i === currentIdx;
            const isFlagged = flaggedIds.has(q.questionId);
            return (
              <TouchableOpacity key={i} onPress={() => setCurrentIdx(i)} style={s.dotWrapper}>
                <View style={[s.dot, isCur && s.dotActive, isAns && !isCur && s.dotAnswered]} />
                {isFlagged && <View style={s.dotFlagMarker} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLast ? (
          <TouchableOpacity
            onPress={handleSubmitPress}
            disabled={submitting}
            activeOpacity={0.8}
            style={s.submitBtn}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Nộp bài</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setCurrentIdx((i) => Math.min(totalQ - 1, i + 1))}
            activeOpacity={0.7}
            style={s.navBtn}
          >
            <Text style={{ color: TEXT, fontWeight: '700' }}>Sau ›</Text>
          </TouchableOpacity>
        )}
      </View>

      <ConfirmDialog
        visible={exitConfirmVisible}
        title="Thoát bài thi?"
        message="Tiến trình sẽ bị mất, không được lưu lại."
        cancelText="Ở lại"
        confirmText="Thoát"
        destructive
        onCancel={() => setExitConfirmVisible(false)}
        onConfirm={() => {
          setExitConfirmVisible(false);
          const exitTo = active.assignmentId ? `/assignments/${active.assignmentId}` : '/quiz';
          useQuizStore.getState().clearAll();
          router.replace(exitTo as never);
        }}
      />

      <ConfirmDialog
        visible={submitConfirmVisible}
        title="Chưa trả lời hết"
        message={`Bạn còn ${totalQ - answeredCount} câu chưa trả lời. Vẫn nộp bài?`}
        cancelText="Tiếp tục làm"
        confirmText="Nộp bài"
        destructive
        onCancel={() => setSubmitConfirmVisible(false)}
        onConfirm={() => {
          setSubmitConfirmVisible(false);
          void doSubmit();
        }}
      />

      <ConfirmDialog
        visible={!!errorMessage}
        title="Lỗi"
        message={errorMessage ?? ''}
        confirmText="Đóng"
        onConfirm={() => setErrorMessage(null)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  exitBtn: { paddingVertical: 6, paddingHorizontal: 2 },
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  timerWarn: { borderColor: 'rgba(201,98,14,0.4)', backgroundColor: 'rgba(201,98,14,0.08)' },
  timerText: { color: TEXT, fontWeight: '800', fontSize: 15 },

  progressTrack: { height: 3, backgroundColor: CARD },
  progressFill:  { height: '100%', backgroundColor: ORANGE, borderRadius: 2 },

  qCounterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  qCounter:    { color: MUTED, fontSize: 12, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  flagBtn:     { width: 32, alignItems: 'flex-end', justifyContent: 'center' },
  questionCard: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    padding: 22, marginBottom: 24,
  },
  questionText: { color: TEXT, fontSize: 17, fontWeight: '600', lineHeight: 26, textAlign: 'center' },


  practiceBadgeWrap: { alignItems: 'center', paddingBottom: 8 },
  practiceBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
    backgroundColor: ORANGE_TINT_FAINT, borderWidth: 1, borderColor: ORANGE,
  },
  practiceBadgeText: { color: ORANGE, fontSize: 11, fontWeight: '800' },

  feedbackBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 16,
  },
  feedbackCorrect: { backgroundColor: 'rgba(63, 107, 69, 0.08)', borderColor: 'rgba(63, 107, 69, 0.35)' },
  feedbackWrong:   { backgroundColor: 'rgba(201, 98, 14, 0.08)', borderColor: 'rgba(201, 98, 14, 0.35)' },
  feedbackText: { fontSize: 13, fontWeight: '700', flex: 1 },

  explanationBox: {
    marginTop: 16, padding: 12, borderRadius: 12,
    backgroundColor: CARD, borderLeftWidth: 4, borderLeftColor: ORANGE,
  },
  explanationLabel: { color: TEXT2, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  explanationText: { color: TEXT2, fontSize: 13, lineHeight: 20 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: BORDER,
    backgroundColor: BG,
  },
  navBtn: {
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: CARD, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  submitBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: ORANGE, borderRadius: 12,
  },
  dotWrapper: { padding: 4, position: 'relative' },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
  },
  dotActive:   { backgroundColor: ORANGE, borderColor: ORANGE, width: 18 },
  dotAnswered: { backgroundColor: GREEN,  borderColor: GREEN },
  dotFlagMarker: {
    position: 'absolute', top: 0, right: 0,
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#eab308', borderWidth: 1, borderColor: BG,
  },
  pill: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: CARD, borderRadius: 12 },
});
