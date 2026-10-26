import { Bookmark, Search, Swords, X } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, ORANGE, ORANGE_TINT_MUTED, SURFACE, TEXT, TEXT2 } from '@/constants/palette';
import { STUDY_NOTE_COLOR } from '@/features/map/types';

export interface BattleListItem {
  id: string;
  title: string;
  yearLabel: string;
  location?: string;
}

export interface StudyNoteListItem {
  pinId: string;
  contextId: string;
  label: string;
  note?: string | null;
  battleTitle: string;
  yearLabel: string;
}

type Tab = 'battles' | 'notes';

/** Danh sách trận đã ghim + mọi ghi chú của tôi, có tìm kiếm — thay cho ô tìm & list bên web. */
export function BattleListSheet({ visible, battles, notes, showNotes, selectedBattleId, onClose, onSelectBattle, onSelectNote }: {
  visible: boolean;
  battles: BattleListItem[];
  notes: StudyNoteListItem[];
  showNotes: boolean;
  selectedBattleId: string | null;
  onClose: () => void;
  onSelectBattle: (id: string) => void;
  onSelectNote: (note: StudyNoteListItem) => void;
}) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('battles');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const active: Tab = showNotes ? tab : 'battles';

  const filteredBattles = battles.filter((b) =>
    !q || [b.title, b.location, b.yearLabel].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));
  const filteredNotes = notes.filter((n) =>
    !q || [n.label, n.note, n.battleTitle].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={s.handle} />
        <View style={s.header}>
          <Text style={s.title}>{active === 'battles' ? 'Trận đánh trên bản đồ' : 'Ghi chú của tôi'}</Text>
          <TouchableOpacity onPress={onClose} style={s.iconBtn} accessibilityLabel="Đóng danh sách">
            <X size={18} color={TEXT} />
          </TouchableOpacity>
        </View>

        {showNotes ? (
          <View style={s.tabs}>
            {([['battles', `Trận đánh · ${battles.length}`], ['notes', `Ghi chú · ${notes.length}`]] as const).map(([key, label]) => (
              <TouchableOpacity key={key} onPress={() => setTab(key)} style={[s.tab, active === key && s.tabActive]}>
                <Text style={[s.tabText, active === key && s.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <View style={s.search}>
          <Search size={16} color={MUTED} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={active === 'battles' ? 'Tìm trận đánh, địa danh, năm…' : 'Tìm ghi chú…'}
            placeholderTextColor={MUTED}
            style={s.searchInput}
          />
        </View>

        {active === 'battles' ? (
          <FlatList
            data={filteredBattles}
            keyExtractor={(b) => b.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={s.empty}>{battles.length ? 'Không có trận đánh phù hợp.' : 'Chưa có trận đánh nào được ghim.'}</Text>}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => onSelectBattle(item.id)}
                style={[s.row, index > 0 && s.divider, item.id === selectedBattleId && s.rowActive]}
              >
                <Swords size={16} color={ORANGE} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={s.rowMeta} numberOfLines={1}>{[item.yearLabel, item.location].filter(Boolean).join(' · ')}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={filteredNotes}
            keyExtractor={(n) => n.pinId}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={s.empty}>
                {notes.length ? 'Không có ghi chú phù hợp.' : 'Chưa có ghi chú. Chọn một trận đánh rồi bấm «Thêm ghi chú».'}
              </Text>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity onPress={() => onSelectNote(item)} style={[s.row, index > 0 && s.divider]}>
                <Bookmark size={16} color={STUDY_NOTE_COLOR} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{item.label}</Text>
                  <Text style={s.rowMeta} numberOfLines={1}>
                    {item.note?.trim() || `${item.battleTitle}${item.yearLabel ? ` · ${item.yearLabel}` : ''}`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '75%', minHeight: '45%',
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: BORDER,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: BORDER, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  title: { color: TEXT, fontSize: 17, fontWeight: '900' },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE,
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  tab: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER },
  tabActive: { backgroundColor: TEXT, borderColor: TEXT },
  tabText: { color: TEXT2, fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: CARD },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12, backgroundColor: SURFACE,
  },
  searchInput: { flex: 1, color: TEXT, fontSize: 14, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4 },
  rowActive: { backgroundColor: ORANGE_TINT_MUTED },
  divider: { borderTopWidth: 1, borderTopColor: BORDER },
  rowTitle: { color: TEXT, fontSize: 14, fontWeight: '700' },
  rowMeta: { color: MUTED, fontSize: 12, marginTop: 1 },
  empty: { color: MUTED, fontSize: 13, textAlign: 'center', paddingVertical: 24 },
});
