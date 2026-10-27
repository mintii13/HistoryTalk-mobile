import { CheckCircle2, Link2, PenLine, XCircle } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { TextInput } from '@/components/ui/text-input';

import { Text } from '@/components/ui/text';
import {
  BORDER,
  CARD,
  GREEN,
  MEN_LAM,
  MUTED,
  ORANGE,
  ORANGE_TINT_FAINT,
  RED,
  SURFACE,
  TEXT,
  TEXT2,
} from '@/constants/palette';
import {
  optionLabel,
  type AnswerData,
  type MatchingPair,
  type TypedQuestion,
} from '@/features/quiz/question-data';

interface QuestionInputProps {
  question: TypedQuestion & { questionId: string };
  answer: AnswerData | undefined;
  onAnswer: (answer: AnswerData) => void;
  /** Hien dap an dung/sai (luyen tap co dap an, hoac man xem lai ket qua). */
  revealed?: boolean;
  /** Khoa khong cho sua (man xem lai). */
  locked?: boolean;
}

/** O nhap cau tra loi cho 3 loai cau hoi: trac nghiem, dien khuyet, noi cap. */
export function QuestionInput({ question, answer, onAnswer, revealed = false, locked = false }: QuestionInputProps) {
  const disabled = locked || revealed;
  switch (question.questionType) {
    case 'FILL_IN_BLANK':
      return <FillInBlankInput answer={answer} onAnswer={onAnswer} disabled={disabled} />;
    case 'MATCHING':
      return <MatchingInput question={question} answer={answer} onAnswer={onAnswer} disabled={disabled} revealed={revealed} />;
    default:
      return <MultipleChoiceInput question={question} answer={answer} onAnswer={onAnswer} disabled={disabled} revealed={revealed} />;
  }
}

function MultipleChoiceInput({ question, answer, onAnswer, disabled, revealed }: {
  question: TypedQuestion;
  answer: AnswerData | undefined;
  onAnswer: (answer: AnswerData) => void;
  disabled: boolean;
  revealed: boolean;
}) {
  const options = question.questionData.options ?? [];
  const correctIds = question.questionData.correctOptionIds ?? [];
  const selectedIds = answer?.selectedOptionIds ?? [];

  return (
    <View style={{ gap: 10 }}>
      {options.map((opt, i) => {
        const isSelected = selectedIds.includes(opt.id);
        const isCorrectOpt = correctIds.includes(opt.id);
        const showCorrect = revealed && isCorrectOpt;
        const showWrong = revealed && isSelected && !isCorrectOpt;
        const highlighted = isSelected || showCorrect;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => !disabled && onAnswer({ selectedOptionIds: [opt.id] })}
            disabled={disabled}
            activeOpacity={0.75}
            style={[
              s.optionBtn,
              isSelected && s.optionBtnSelected,
              showCorrect && s.optionBtnCorrect,
              showWrong && s.optionBtnWrong,
            ]}
          >
            <View
              style={[
                s.optionLetter,
                isSelected && s.optionLetterSelected,
                showCorrect && s.optionLetterCorrect,
                showWrong && s.optionLetterWrong,
              ]}
            >
              <Text style={{ color: highlighted ? '#fff' : TEXT2, fontSize: 13, fontWeight: '800' }}>
                {optionLabel(i)}
              </Text>
            </View>
            <Text style={[s.optionText, highlighted && { color: TEXT }]}>{opt.text}</Text>
            {showCorrect && <CheckCircle2 size={16} color={GREEN} strokeWidth={2.5} />}
            {showWrong && <XCircle size={16} color={RED} strokeWidth={2.5} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function FillInBlankInput({ answer, onAnswer, disabled }: {
  answer: AnswerData | undefined;
  onAnswer: (answer: AnswerData) => void;
  disabled: boolean;
}) {
  return (
    <View style={s.fillWrap}>
      <PenLine size={18} color={MEN_LAM} />
      <TextInput
        value={answer?.answers?.[0] ?? ''}
        onChangeText={(text) => onAnswer({ answers: [text] })}
        editable={!disabled}
        placeholder="Nhập câu trả lời của bạn..."
        placeholderTextColor={MUTED}
        autoCorrect={false}
        returnKeyType="done"
        style={s.fillInput}
      />
    </View>
  );
}

function MatchingInput({ question, answer, onAnswer, disabled, revealed }: {
  question: TypedQuestion;
  answer: AnswerData | undefined;
  onAnswer: (answer: AnswerData) => void;
  disabled: boolean;
  revealed: boolean;
}) {
  const leftItems = question.questionData.leftItems ?? [];
  const rightItems = question.questionData.rightItems ?? [];
  const correctPairs = question.questionData.correctPairs ?? [];
  const pairs = answer?.pairs ?? [];

  function setPair(leftId: string, rightId: string) {
    const current = pairs.find((p) => p.leftId === leftId)?.rightId;
    const rest = pairs.filter((p) => p.leftId !== leftId);
    // Bam lai lua chon dang chon thi bo chon.
    const next: MatchingPair[] = current === rightId ? rest : [...rest, { leftId, rightId }];
    next.sort(
      (a, b) => leftItems.findIndex((it) => it.id === a.leftId) - leftItems.findIndex((it) => it.id === b.leftId),
    );
    onAnswer({ pairs: next });
  }

  return (
    <View style={{ gap: 12 }}>
      <Text style={s.matchHint}>Chọn một đáp án bên dưới cho mỗi mục.</Text>
      {leftItems.map((left) => {
        const chosen = pairs.find((p) => p.leftId === left.id)?.rightId;
        const correctRight = correctPairs.find((p) => p.leftId === left.id)?.rightId;
        const status = revealed && correctPairs.length > 0 ? (chosen === correctRight ? 'correct' : 'wrong') : null;
        return (
          <View
            key={left.id}
            style={[
              s.matchRow,
              chosen ? s.matchRowChosen : null,
              status === 'correct' && s.optionBtnCorrect,
              status === 'wrong' && s.optionBtnWrong,
            ]}
          >
            <View style={s.matchLeft}>
              <Link2 size={14} color={TEXT2} />
              <Text style={s.matchLeftText}>{left.text}</Text>
            </View>
            <View style={s.chips}>
              {rightItems.map((right) => {
                const active = chosen === right.id;
                const isCorrect = revealed && correctRight === right.id;
                return (
                  <TouchableOpacity
                    key={right.id}
                    disabled={disabled}
                    onPress={() => setPair(left.id, right.id)}
                    activeOpacity={0.75}
                    style={[s.chip, active && s.chipActive, isCorrect && s.chipCorrect]}
                  >
                    <Text style={[s.chipText, (active || isCorrect) && { color: '#fff' }]}>{right.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  optionBtnSelected: { borderColor: ORANGE, backgroundColor: ORANGE_TINT_FAINT },
  optionBtnCorrect: { borderColor: GREEN, backgroundColor: 'rgba(63, 107, 69, 0.08)' },
  optionBtnWrong: { borderColor: RED, backgroundColor: 'rgba(201, 98, 14, 0.08)' },
  optionLetter: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  optionLetterSelected: { backgroundColor: ORANGE },
  optionLetterCorrect: { backgroundColor: GREEN },
  optionLetterWrong: { backgroundColor: RED },
  optionText: { flex: 1, color: TEXT2, fontSize: 14, fontWeight: '500', lineHeight: 20 },

  fillWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(31,78,156,0.06)', borderRadius: 10, borderWidth: 2, borderColor: MEN_LAM,
    paddingHorizontal: 14,
  },
  fillInput: { flex: 1, minHeight: 52, color: TEXT, fontSize: 16, fontWeight: '600' },

  matchHint: { color: MUTED, fontSize: 12, textAlign: 'center' },
  matchRow: {
    gap: 10, backgroundColor: CARD, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, padding: 14,
  },
  matchRowChosen: { borderColor: ORANGE },
  matchLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchLeftText: { flex: 1, color: TEXT, fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
  },
  chipActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  chipCorrect: { backgroundColor: GREEN, borderColor: GREEN },
  chipText: { color: TEXT2, fontSize: 13, fontWeight: '600' },
});
