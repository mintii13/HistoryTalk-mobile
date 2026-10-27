import { Bookmark, LocateFixed, Move, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import { TextInput } from '@/components/ui/text-input';

import { Text } from '@/components/ui/text';
import { BG, BORDER, MUTED, ORANGE, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import {
  STUDY_NOTE_COLOR,
  STUDY_NOTE_LABEL_MAX,
  STUDY_NOTE_TEXT_MAX,
  type MapCoordinates,
  type MapPin,
} from '@/features/map/types';

export interface StudyNoteDraft {
  label: string;
  note: string;
}

/** Form thêm / sửa ghi chú học tập; vị trí chọn bằng cách chạm lên bản đồ (giống web). */
export function StudyNoteForm({ battleTitle, yearLabel, initial, coordinates, placing, submitting, onPickOnMap, onCancel, onSubmit }: {
  battleTitle: string;
  yearLabel: string;
  initial: MapPin | null;
  coordinates: MapCoordinates | null;
  placing: boolean;
  submitting: boolean;
  onPickOnMap: () => void;
  onCancel: () => void;
  onSubmit: (draft: StudyNoteDraft) => void;
}) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [note, setNote] = useState(initial?.description ?? '');
  const trimmed = label.trim();
  const canSave = !!coordinates && !!trimmed && !submitting;

  return (
    <View style={{ gap: 14 }}>
      <View style={s.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={s.eyebrowRow}>
            <Bookmark size={13} color={STUDY_NOTE_COLOR} />
            <Text style={s.eyebrow}>Ghi chú của tôi</Text>
          </View>
          <Text style={s.title}>{initial ? 'Sửa ghi chú' : 'Thêm ghi chú'}</Text>
          <Text style={s.meta} numberOfLines={1}>{battleTitle}{yearLabel ? ` · ${yearLabel}` : ''}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={s.iconBtn} accessibilityLabel="Hủy">
          <X size={17} color={TEXT} />
        </TouchableOpacity>
      </View>

      {placing ? (
        <View style={s.placingBox}>
          <LocateFixed size={18} color={STUDY_NOTE_COLOR} />
          <Text style={s.placingText}>Chạm vào bản đồ để đặt ghi chú.</Text>
        </View>
      ) : (
        <View style={s.coordRow}>
          <Text style={s.coordText}>
            {coordinates ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}` : 'Chưa chọn vị trí'}
          </Text>
          <TouchableOpacity onPress={onPickOnMap} style={s.inlineBtn}>
            <Move size={13} color={STUDY_NOTE_COLOR} />
            <Text style={s.inlineBtnText}>Chọn lại vị trí</Text>
          </TouchableOpacity>
        </View>
      )}

      <View>
        <View style={s.fieldLabelRow}>
          <Text style={s.fieldLabel}>Tiêu đề *</Text>
          <Text style={s.counter}>{label.length}/{STUDY_NOTE_LABEL_MAX}</Text>
        </View>
        <TextInput
          value={label}
          onChangeText={setLabel}
          maxLength={STUDY_NOTE_LABEL_MAX}
          placeholder="Ví dụ: Bãi cọc ngầm"
          placeholderTextColor={MUTED}
          style={s.input}
        />
      </View>

      <View>
        <Text style={[s.fieldLabel, { marginBottom: 6 }]}>Ghi chú</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          maxLength={STUDY_NOTE_TEXT_MAX}
          placeholder="Điều bạn muốn nhớ về địa điểm này…"
          placeholderTextColor={MUTED}
          multiline
          textAlignVertical="top"
          style={[s.input, s.textarea]}
        />
      </View>

      <Text style={s.meta}>Chỉ mình bạn nhìn thấy ghi chú này.</Text>

      <View style={s.actions}>
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn}>
          <Text style={s.cancelText}>Hủy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => canSave && onSubmit({ label: trimmed, note: note.trim() })}
          disabled={!canSave}
          style={[s.saveBtn, !canSave && { opacity: 0.45 }]}
        >
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Bookmark size={16} color="#fff" />}
          <Text style={s.saveText}>Lưu ghi chú</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eyebrow: { color: STUDY_NOTE_COLOR, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: TEXT, fontSize: 19, fontWeight: '900', marginTop: 2 },
  meta: { color: MUTED, fontSize: 12, marginTop: 2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  placingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
    borderWidth: 1, borderColor: STUDY_NOTE_COLOR, borderRadius: 10, backgroundColor: BG,
  },
  placingText: { flex: 1, color: TEXT, fontSize: 13 },
  coordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BORDER, borderRadius: 10, backgroundColor: BG,
  },
  coordText: { color: TEXT2, fontSize: 12 },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineBtnText: { color: STUDY_NOTE_COLOR, fontSize: 12, fontWeight: '800' },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: { color: MUTED, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  counter: { color: MUTED, fontSize: 11 },
  input: {
    borderWidth: 1, borderColor: BORDER, borderRadius: 10, backgroundColor: SURFACE,
    paddingHorizontal: 12, paddingVertical: 10, color: TEXT, fontSize: 14,
  },
  textarea: { minHeight: 110 },
  actions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  cancelText: { color: TEXT, fontSize: 14, fontWeight: '800' },
  saveBtn: {
    flex: 1.4, height: 44, borderRadius: 12, flexDirection: 'row', gap: 6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: ORANGE,
  },
  saveText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
