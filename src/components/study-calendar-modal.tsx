import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, ORANGE_TINT_MUTED, SURFACE, TEXT } from '@/constants/palette';
import { useStudyDays } from '@/features/gamification/hooks/use-study-days';

/**
 * Lịch chuỗi ngày học theo tháng — bản mobile của StudyCalendar bên web
 * (GET /gamification/study-days). Ngày đã học có dấu tick, hôm nay viền màu
 * chủ đạo, ngày tương lai bị mờ và không bấm được.
 */

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const STREAK_GREEN = '#16A34A';

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface StudyCalendarModalProps {
  /** Hôm nay theo backend (yyyy-MM-dd, lấy từ /gamification/today). */
  today: string;
  visible: boolean;
  onClose: () => void;
}

export function StudyCalendarModal({ today, visible, onClose }: StudyCalendarModalProps) {
  const [monthDate, setMonthDate] = useState(() => {
    const [year, month] = today.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const { data, isPending, isError, refetch } = useStudyDays(year, month, visible);
  const studied = new Set(data ?? []);
  const firstWeekday = (monthDate.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const viewingMonth = dateKey(year, month, 1).slice(0, 7);
  const canGoBack = year > 2000 || month > 1;
  const canGoForward = viewingMonth < today.slice(0, 7);

  function moveMonth(offset: number) {
    setMonthDate(new Date(year, month - 1 + offset, 1));
    setSelectedDate(null);
  }

  // Chia ô thành từng hàng 7 ngày để mỗi ô có chiều rộng bằng nhau
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Chuỗi ngày học</Text>
              <Text style={s.subtitle}>Các ngày đã học được đánh dấu trong lịch.</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Đóng lịch">
              <X size={18} color={TEXT} />
            </TouchableOpacity>
          </View>

          <View style={s.monthRow}>
            <TouchableOpacity
              onPress={() => moveMonth(-1)}
              disabled={!canGoBack}
              style={[s.navBtn, !canGoBack && s.disabled]}
              accessibilityLabel="Tháng trước"
            >
              <ChevronLeft size={18} color={TEXT} />
            </TouchableOpacity>
            <Text style={s.monthLabel}>Tháng {month}/{year}</Text>
            <TouchableOpacity
              onPress={() => moveMonth(1)}
              disabled={!canGoForward}
              style={[s.navBtn, !canGoForward && s.disabled]}
              accessibilityLabel="Tháng sau"
            >
              <ChevronRight size={18} color={TEXT} />
            </TouchableOpacity>
          </View>

          <View style={s.weekRow}>
            {WEEKDAYS.map((d) => (
              <Text key={d} style={s.weekLabel}>{d}</Text>
            ))}
          </View>

          {isPending ? (
            <View style={s.placeholder}>
              <ActivityIndicator color={ORANGE} />
              <Text style={s.placeholderText}>Đang tải lịch học...</Text>
            </View>
          ) : isError ? (
            <View style={s.placeholder}>
              <Text style={s.placeholderText}>Không tải được lịch học.</Text>
              <TouchableOpacity onPress={() => void refetch()}>
                <Text style={s.retry}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ gap: 4 }}>
                {rows.map((row, ri) => (
                  <View key={ri} style={s.weekRow}>
                    {row.map((day, ci) => {
                      if (day === null) return <View key={`e-${ri}-${ci}`} style={s.cell} />;
                      const key = dateKey(year, month, day);
                      const isFuture = key > today;
                      const isStudied = studied.has(key);
                      const isToday = key === today;
                      return (
                        <TouchableOpacity
                          key={key}
                          disabled={isFuture}
                          onPress={() => setSelectedDate(key)}
                          accessibilityLabel={`${day}/${month}/${year}: ${isStudied ? 'đã học' : isFuture ? 'chưa đến' : 'chưa ghi nhận học'}`}
                          style={[
                            s.cell,
                            s.day,
                            isStudied && s.dayStudied,
                            isToday && s.dayToday,
                            selectedDate === key && (isStudied ? s.dayStudiedSelected : s.daySelected),
                            isFuture && s.disabled,
                          ]}
                        >
                          {isStudied ? (
                            <Check size={15} color="#fff" strokeWidth={3} />
                          ) : (
                            <Text style={[s.dayText, isToday && { color: ORANGE }]}>{day}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
              <Text style={s.footer}>
                {selectedDate
                  ? `${selectedDate.split('-').reverse().join('/')}: ${studied.has(selectedDate) ? 'Đã học' : 'Chưa ghi nhận học'}`
                  : `${studied.size} ngày học trong tháng`}
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  title: { color: TEXT, fontSize: 18, fontWeight: '900' },
  subtitle: { color: MUTED, fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  monthLabel: { color: TEXT, fontSize: 16, fontWeight: '800' },
  weekRow: { flexDirection: 'row', gap: 4 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
  },
  cell: { flex: 1, aspectRatio: 1 },
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  dayStudied: { backgroundColor: STREAK_GREEN, borderColor: STREAK_GREEN },
  dayToday: { borderWidth: 2, borderColor: ORANGE },
  daySelected: { backgroundColor: ORANGE_TINT_MUTED },
  dayStudiedSelected: { borderWidth: 2, borderColor: TEXT },
  dayText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.35 },
  placeholder: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: MUTED, fontSize: 13 },
  retry: { color: ORANGE, fontSize: 13, fontWeight: '800' },
  footer: { color: MUTED, fontSize: 12, marginTop: 12 },
});
