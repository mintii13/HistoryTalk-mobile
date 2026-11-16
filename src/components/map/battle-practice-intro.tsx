import { Brain, Eye, PenLine, RotateCcw, Scale, Trophy, X } from 'lucide-react-native';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, ORANGE_TINT_MUTED, TEXT, TEXT2 } from '@/constants/palette';
import type { PracticeRecord } from '@/features/map/practice-progress';

const STEPS = [
  { icon: Eye, title: 'Lược đồ tạm ẩn', text: 'Bạn chỉ còn ảnh nền trống và các phe của trận đánh.' },
  { icon: PenLine, title: 'Vẽ lại theo trí nhớ', text: 'Chạm để đặt ký hiệu, kéo ngón tay để vẽ mũi tên và phòng tuyến, đúng phe và đúng chiều.' },
  { icon: Scale, title: 'So sánh và xếp hạng', text: 'Ứng dụng chấm theo vị trí, loại và phe. Vẽ thiếu hay vẽ thừa đều trừ điểm.' },
];

/** Giai thich "Thu thach tri nho" lan dau (ban mobile cua BattleMapPracticeIntro). */
export function BattlePracticeIntro({
  visible,
  symbolCount,
  record,
  canReplay,
  onStart,
  onReplay,
  onClose,
}: {
  visible: boolean;
  symbolCount: number;
  record: PracticeRecord | null;
  canReplay: boolean;
  onStart: () => void;
  onReplay: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <TouchableOpacity onPress={onClose} style={s.close} accessibilityLabel="Đóng" hitSlop={8}>
            <X size={18} color={MUTED} />
          </TouchableOpacity>
          <View style={s.badge}><Brain size={26} color={ORANGE} /></View>
          <Text style={s.kicker}>Thử thách trí nhớ</Text>
          <Text style={s.title}>Vẽ lại {symbolCount} ký hiệu của trận đánh</Text>

          <View style={{ gap: 12, marginTop: 14 }}>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <View key={title} style={s.step}>
                <View style={s.stepIcon}><Icon size={16} color={ORANGE} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{i + 1}. {title}</Text>
                  <Text style={s.stepText}>{text}</Text>
                </View>
              </View>
            ))}
          </View>

          {record ? (
            <View style={s.record}>
              <Trophy size={14} color={ORANGE} />
              <Text style={s.recordText}>
                Kỷ lục của bạn: {record.best.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% sau {record.attempts} lần thử
              </Text>
            </View>
          ) : null}

          <TouchableOpacity onPress={onStart} style={s.primary}>
            <Text style={s.primaryText}>Bắt đầu vẽ</Text>
          </TouchableOpacity>
          {canReplay ? (
            <TouchableOpacity onPress={onReplay} style={s.secondary}>
              <RotateCcw size={14} color={TEXT} />
              <Text style={s.secondaryText}>Xem lại diễn biến trước</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 420, backgroundColor: CARD, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: BORDER },
  close: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
  badge: { width: 52, height: 52, borderRadius: 26, backgroundColor: ORANGE_TINT_MUTED, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: ORANGE, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 12 },
  title: { color: TEXT, fontSize: 19, fontWeight: '900', marginTop: 2 },
  step: { flexDirection: 'row', gap: 10 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: ORANGE_TINT_MUTED, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { color: TEXT, fontSize: 14, fontWeight: '800' },
  stepText: { color: TEXT2, fontSize: 13, lineHeight: 18, marginTop: 1 },
  record: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  recordText: { color: TEXT2, fontSize: 12, fontWeight: '600' },
  primary: { marginTop: 18, height: 48, borderRadius: 12, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondary: { marginTop: 8, height: 42, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: TEXT, fontSize: 13, fontWeight: '700' },
});
