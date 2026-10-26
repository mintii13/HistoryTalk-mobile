import { Image } from 'expo-image';
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  LocateFixed,
  MapPin as MapPinIcon,
  Move,
  Plus,
  SquarePen,
  Swords,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { BG, BORDER, MUTED, ORANGE, ORANGE_TINT_MUTED, RED, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import { getCharacterImageUri, type Character } from '@/features/characters/types';
import type { HistoricalContext } from '@/features/historical-contexts/types';
import { getContextImageUri } from '@/features/historical-contexts/types';
import { battleYearLabel } from '@/features/map/hooks/use-map-battles';
import { STUDY_NOTE_COLOR, type MapPin } from '@/features/map/types';

const SectionLabel = ({ children }: { children: string }) => <Text style={s.sectionLabel}>{children}</Text>;

interface NotesProps {
  notes: MapPin[];
  loading: boolean;
  selectedId: string | null;
  busy: boolean;
  canAdd: boolean;
  onSelect: (pin: MapPin) => void;
  onAdd: () => void;
  onEdit: (pin: MapPin) => void;
  onMove: (pin: MapPin) => void;
  onDelete: (pin: MapPin) => void;
}

/** Khối "Ghi chú của tôi": danh sách + thêm / sửa / dời / xoá (giống StudyNotesSection web). */
function StudyNotesSection({ notes, loading, selectedId, busy, canAdd, onSelect, onAdd, onEdit, onMove, onDelete }: NotesProps) {
  return (
    <View>
      <View style={s.rowBetween}>
        <SectionLabel>{`Ghi chú của tôi${!loading && notes.length ? ` · ${notes.length}` : ''}`}</SectionLabel>
        {notes.length > 0 && canAdd ? (
          <TouchableOpacity onPress={onAdd} disabled={busy} style={[s.inlineBtn, busy && s.disabled]}>
            <Plus size={13} color={STUDY_NOTE_COLOR} />
            <Text style={[s.inlineBtnText, { color: STUDY_NOTE_COLOR }]}>Thêm ghi chú</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <Text style={s.muted}>Đang tải ghi chú…</Text>
      ) : notes.length === 0 ? (
        <View style={s.dashedBox}>
          <Text style={s.body}>Đánh dấu một địa điểm của trận đánh kèm lời ghi chú để ôn lại sau. Chỉ mình bạn thấy.</Text>
          {canAdd ? (
            <TouchableOpacity onPress={onAdd} disabled={busy} style={[s.inkBtn, busy && s.disabled]}>
              <LocateFixed size={15} color="#fff" />
              <Text style={s.inkBtnText}>Thêm ghi chú</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={s.noteList}>
          {notes.map((pin, i) => {
            const selected = pin.pinId === selectedId;
            return (
              <View key={pin.pinId} style={[i > 0 && s.noteDivider, selected && { backgroundColor: ORANGE_TINT_MUTED }]}>
                <TouchableOpacity onPress={() => onSelect(pin)} style={s.noteRow} activeOpacity={0.7}>
                  <View style={s.noteSwatch} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.noteTitle} numberOfLines={selected ? undefined : 1}>{pin.label}</Text>
                    {pin.description?.trim() ? (
                      <Text style={s.noteBody} numberOfLines={selected ? undefined : 1}>{pin.description}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {selected ? (
                  <View style={s.noteActions}>
                    <NoteAction icon={SquarePen} label="Sửa" onPress={() => onEdit(pin)} disabled={busy} />
                    <NoteAction icon={Move} label="Đổi vị trí" onPress={() => onMove(pin)} disabled={busy} />
                    <NoteAction icon={Trash2} label="Xóa" onPress={() => onDelete(pin)} disabled={busy} danger />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function NoteAction({ icon: Icon, label, onPress, disabled, danger }: {
  icon: typeof Plus;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const color = danger ? RED : TEXT;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[s.noteAction, { borderColor: color }, disabled && s.disabled]}>
      <Icon size={13} color={color} />
      <Text style={[s.noteActionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface BattlePanelProps {
  event: HistoricalContext;
  pin: MapPin | null;
  characters: Character[];
  charactersLoading: boolean;
  startingCharacterId: string | null;
  onOpenCharacter: (character: Character) => void;
  onOpenDetail: () => void;
  onOpenContext: () => void;
  /** null = role không được ghi chú. */
  notes: NotesProps | null;
}

/** Bảng thông tin trận đang chọn — bản mobile của BattleContextPanel (người học). */
export function BattlePanel({
  event, pin, characters, charactersLoading, startingCharacterId, onOpenCharacter, onOpenDetail, onOpenContext, notes,
}: BattlePanelProps) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const phases = event.battleMap?.phases ?? [];
  const image = getContextImageUri(event);
  const yearLabel = battleYearLabel(event);
  const summary = event.description?.trim() || 'Bối cảnh này chưa có phần mô tả.';

  return (
    <View style={{ gap: 18 }}>
      {/* Đầu bảng gọn: ảnh bên cạnh thông tin */}
      <View style={s.head}>
        <View style={s.thumb}>
          {image ? (
            <Image source={{ uri: image }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Swords size={28} color={ORANGE} />
          )}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {yearLabel ? <Text style={s.year}>{yearLabel}</Text> : null}
          <Text style={s.title} numberOfLines={2}>{event.name}</Text>
          <View style={s.metaRow}>
            {event.location ? (
              <View style={s.metaItem}>
                <MapPinIcon size={12} color={ORANGE} />
                <Text style={s.metaText} numberOfLines={1}>{event.location}</Text>
              </View>
            ) : null}
            {phases.length > 0 ? (
              <View style={s.metaItem}>
                <AudioLines size={12} color={STUDY_NOTE_COLOR} />
                <Text style={[s.metaText, { color: STUDY_NOTE_COLOR }]}>{phases.length} giai đoạn</Text>
              </View>
            ) : pin?.description?.trim() ? (
              <View style={s.metaItem}>
                <AudioLines size={12} color={STUDY_NOTE_COLOR} />
                <Text style={[s.metaText, { color: STUDY_NOTE_COLOR }]}>Có thuyết minh</Text>
              </View>
            ) : null}
            {!pin ? <Text style={s.metaText}>Chưa ghim trên bản đồ</Text> : null}
          </View>
        </View>
      </View>

      <View>
        <SectionLabel>Bối cảnh</SectionLabel>
        <Text style={s.body} numberOfLines={summaryOpen ? undefined : 3}>{summary}</Text>
        <View style={[s.rowBetween, { marginTop: 4 }]}>
          {summary.length > 160 ? (
            <TouchableOpacity onPress={() => setSummaryOpen((o) => !o)}>
              <Text style={s.link}>{summaryOpen ? 'Thu gọn' : 'Đọc thêm'}</Text>
            </TouchableOpacity>
          ) : <View />}
          <TouchableOpacity onPress={onOpenContext} style={s.inlineBtn}>
            <Text style={s.link}>Mở trang bối cảnh</Text>
            <ArrowUpRight size={13} color={ORANGE} />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <SectionLabel>Gặp nhân vật lịch sử</SectionLabel>
        {characters.length > 0 ? (
          <View style={s.charGrid}>
            {characters.slice(0, 6).map((c) => {
              const uri = getCharacterImageUri(c);
              const busy = startingCharacterId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => onOpenCharacter(c)}
                  disabled={!!startingCharacterId}
                  style={s.charCard}
                  accessibilityLabel={`Trò chuyện với ${c.name}`}
                >
                  <View style={s.avatar}>
                    {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
                      <Text style={s.avatarInitial}>{c.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.charName} numberOfLines={1}>{c.name}</Text>
                    {busy ? <ActivityIndicator size="small" color={ORANGE} style={{ alignSelf: 'flex-start' }} /> : (
                      <View style={s.inlineBtn}>
                        <Text style={s.charAction}>Trò chuyện</Text>
                        <ArrowUpRight size={11} color={ORANGE} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : charactersLoading ? (
          <Text style={s.muted}>Đang tải nhân vật…</Text>
        ) : (
          <Text style={s.muted}>Chưa có nhân vật liên kết.</Text>
        )}
      </View>

      {notes ? <StudyNotesSection {...notes} /> : null}

      {phases.length > 0 ? (
        <View>
          <SectionLabel>Diễn biến</SectionLabel>
          <View style={{ gap: 4 }}>
            {phases.map((phase, i) => (
              <View key={phase.id} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={s.phaseIndex}>{i + 1}</Text>
                <Text style={s.phaseTitle} numberOfLines={1}>{phase.title || 'Chưa đặt tên'}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : pin?.description?.trim() ? (
        <View>
          <SectionLabel>Thuyết minh diễn biến</SectionLabel>
          <Text style={s.body} numberOfLines={2}>{pin.description}</Text>
        </View>
      ) : null}

      <TouchableOpacity onPress={onOpenDetail} style={s.cta} activeOpacity={0.85}>
        <BookOpen size={17} color="#fff" />
        <Text style={s.ctaText}>Khám phá trận đánh</Text>
        <ArrowUpRight size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  sectionLabel: { color: MUTED, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  muted: { color: MUTED, fontSize: 13 },
  body: { color: TEXT, fontSize: 14, lineHeight: 21 },
  link: { color: ORANGE, fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  inlineBtnText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  head: { flexDirection: 'row', gap: 12 },
  thumb: {
    width: 80, height: 80, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: BORDER,
    backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center',
  },
  year: { color: ORANGE, fontSize: 22, fontWeight: '900', lineHeight: 26 },
  title: { color: TEXT, fontSize: 17, fontWeight: '800', lineHeight: 21, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  metaText: { color: TEXT2, fontSize: 12 },

  charGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  charCard: {
    width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6,
    borderWidth: 1, borderColor: BORDER, borderRadius: 8,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: ORANGE,
    backgroundColor: ORANGE_TINT_MUTED, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: ORANGE, fontSize: 14, fontWeight: '800' },
  charName: { color: TEXT, fontSize: 13, fontWeight: '700' },
  charAction: { color: ORANGE, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },

  dashedBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: BORDER, borderRadius: 8, backgroundColor: BG, padding: 12, gap: 10 },
  inkBtn: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: TEXT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  inkBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  noteList: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, overflow: 'hidden' },
  noteDivider: { borderTopWidth: 1, borderTopColor: BORDER },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  noteSwatch: { width: 10, height: 10, borderRadius: 2, backgroundColor: STUDY_NOTE_COLOR, marginTop: 4 },
  noteTitle: { color: TEXT, fontSize: 13, fontWeight: '700' },
  noteBody: { color: TEXT2, fontSize: 12, lineHeight: 18, marginTop: 2 },
  noteActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingLeft: 32, paddingRight: 12, paddingBottom: 10 },
  noteAction: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, height: 32 },
  noteActionText: { fontSize: 11, fontWeight: '800' },

  phaseIndex: { width: 16, textAlign: 'right', color: MUTED, fontSize: 13, fontWeight: '800' },
  phaseTitle: { flex: 1, color: TEXT2, fontSize: 13 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: ORANGE, borderRadius: 12, height: 48,
  },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
