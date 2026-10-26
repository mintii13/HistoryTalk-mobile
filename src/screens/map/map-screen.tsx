import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, ChevronDown, ChevronUp, List, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/confirm-modal';
import { BattleListSheet, type StudyNoteListItem } from '@/components/map/battle-list-sheet';
import { BattlePanel } from '@/components/map/battle-panel';
import {
  HistoricalLeafletMap,
  type HistoricalLeafletMapHandle,
  type MapBattleMarker,
  type MapNoteMarker,
} from '@/components/map/historical-leaflet-map';
import { StudyNoteForm, type StudyNoteDraft } from '@/components/map/study-note-form';
import { Text } from '@/components/ui/text';
import { BORDER, CARD, MUTED, SURFACE, TEXT } from '@/constants/palette';
import { useAuthStore } from '@/features/auth/store';
import { useCharactersByContext } from '@/features/characters/hooks/use-characters-by-context';
import { useStartChat } from '@/features/chat/hooks/use-start-chat';
import { getContextImageUri } from '@/features/historical-contexts/types';
import { useDefaultMapFocus } from '@/features/map/hooks/use-map-focuses';
import { battleYear, battleYearLabel, useMapBattles } from '@/features/map/hooks/use-map-battles';
import {
  useCreateStudyNote,
  useDeleteStudyNote,
  useMapPins,
  useOverviewMapPins,
  useUpdateStudyNote,
} from '@/features/map/hooks/use-map-pins';
import { STUDY_NOTE_COLOR, STUDY_NOTE_ROLES, type MapCoordinates, type MapPin } from '@/features/map/types';

/** Phần bản đồ bảng thông tin che (maxHeight 62%) — camera đặt điểm đến phía trên bảng. */
const PANEL_COVER = 0.6;

/** Form thêm/sửa ghi chú; `placing` = lần chạm bản đồ kế tiếp đặt vị trí. */
type NoteEditor = { contextId: string; pin: MapPin | null; coordinates: MapCoordinates | null; placing: boolean };

/**
 * "Bản đồ trận đánh" — bản mobile của trang /map bên web (lớp Bản đồ chung +
 * Ghi chú của tôi): trận do Content Admin ghim, bảng thông tin trận, nhân vật để
 * trò chuyện, ghi chú học tập cá nhân (ghim USER) và lối vào trang lược đồ.
 */
export default function MapScreen() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const canTakeNotes = !!role && STUDY_NOTE_ROLES.includes(role);
  const mapRef = useRef<HistoricalLeafletMapHandle>(null);

  const [selectedBattleId, setSelectedBattleId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteEditor, setNoteEditor] = useState<NoteEditor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MapPin | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  /** Chọn trận từ 1 ghi chú: camera bay tới ghi chú, không bay về ghim trận. */
  const skipBattleFlight = useRef(false);

  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useMapBattles();
  const overviewQueries = useOverviewMapPins(events.map((e) => ({ id: e.id, year: battleYear(e) })));
  const overviewLoading = overviewQueries.some((q) => q.isLoading);

  const activeEvent = events.find((e) => e.id === selectedBattleId);
  const activeYear = activeEvent ? battleYear(activeEvent) : 0;
  const { data: pins = [], isLoading: pinsLoading } = useMapPins(selectedBattleId, activeYear);
  const { data: characters = [], isLoading: charactersLoading } = useCharactersByContext(selectedBattleId ?? '');
  const cameraFocus = useDefaultMapFocus(selectedBattleId);
  const createNote = useCreateStudyNote(selectedBattleId, activeYear);
  const updateNote = useUpdateStudyNote(selectedBattleId, activeYear);
  const deleteNote = useDeleteStudyNote(selectedBattleId, activeYear);
  const { startChat, startingId } = useStartChat();

  const mainPin = pins.find((p) => p.pinOwnerType === 'ADMIN') ?? null;
  const studyNotes = useMemo(
    () => (canTakeNotes ? pins.filter((p) => p.pinOwnerType === 'USER') : []),
    [canTakeNotes, pins],
  );
  const notesBusy = !!noteEditor || createNote.isPending || updateNote.isPending || deleteNote.isPending;
  const placing = !!noteEditor?.placing;

  // Người học chỉ thấy những trận đã có ghim ADMIN (giống web)
  const battleMarkers = useMemo<MapBattleMarker[]>(() => overviewQueries.flatMap((q, i) => {
    const event = events[i];
    const pin = q.data?.find((p) => p.pinOwnerType === 'ADMIN');
    if (!event || !pin) return [];
    return [{
      id: event.id,
      title: event.name,
      yearLabel: battleYearLabel(event),
      imageUrl: getContextImageUri(event),
      lat: pin.latitude,
      lng: pin.longitude,
    }];
  }), [overviewQueries, events]);

  // Mọi ghi chú của tôi — đọc lại từ chính các query tổng quan, không tốn request thêm
  const allStudyNotes = useMemo<(StudyNoteListItem & MapCoordinates)[]>(() => {
    if (!canTakeNotes) return [];
    return overviewQueries.flatMap((q, i) => {
      const event = events[i];
      if (!event) return [];
      return (q.data ?? []).filter((p) => p.pinOwnerType === 'USER').map((p) => ({
        pinId: p.pinId,
        contextId: p.contextId,
        label: p.label,
        note: p.description,
        battleTitle: event.name,
        yearLabel: battleYearLabel(event),
        latitude: p.latitude,
        longitude: p.longitude,
      }));
    });
  }, [canTakeNotes, overviewQueries, events]);

  const noteMarkers = useMemo<MapNoteMarker[]>(() => studyNotes
    .filter((p) => p.pinId !== noteEditor?.pin?.pinId)
    .map((p) => ({ id: p.pinId, lat: p.latitude, lng: p.longitude })), [studyNotes, noteEditor?.pin?.pinId]);

  // ── Camera: chọn trận → bay tới điểm camera của staff (hoặc ghim), bỏ chọn → toàn cảnh ──
  const targetLat = cameraFocus?.latitude ?? mainPin?.latitude;
  const targetLng = cameraFocus?.longitude ?? mainPin?.longitude;
  const targetZoom = cameraFocus?.zoomLevel ?? 9;
  const hadSelection = useRef(false);
  useEffect(() => {
    if (selectedBattleId) {
      hadSelection.current = true;
      if (skipBattleFlight.current) { skipBattleFlight.current = false; return; }
      if (typeof targetLat === 'number' && typeof targetLng === 'number') mapRef.current?.flyTo(targetLat, targetLng, targetZoom, PANEL_COVER);
    } else if (hadSelection.current) {
      hadSelection.current = false;
      mapRef.current?.resetView();
    }
  }, [selectedBattleId, targetLat, targetLng, targetZoom]);

  function chooseBattle(id: string | null) {
    setSelectedBattleId(id);
    setSelectedNoteId(null);
    setNoteEditor(null);
    setPanelCollapsed(false);
  }

  function selectNote(pin: { pinId: string; latitude: number; longitude: number }) {
    setSelectedNoteId(pin.pinId);
    setPanelCollapsed(false);
    mapRef.current?.focusPoint(pin.latitude, pin.longitude, PANEL_COVER);
  }

  function openStudyNote(note: StudyNoteListItem & MapCoordinates) {
    setListOpen(false);
    if (note.contextId !== selectedBattleId) {
      skipBattleFlight.current = true;
      chooseBattle(note.contextId);
    }
    selectNote(note);
  }

  function onMapPress(coordinates: MapCoordinates) {
    if (noteEditor?.placing) {
      setNoteEditor({ ...noteEditor, coordinates, placing: false });
      setPanelCollapsed(false);
      return;
    }
    // Chạm nền bản đồ = bỏ chọn trận (giống web)
    if (selectedBattleId && !noteEditor) chooseBattle(null);
  }

  function startNote() {
    if (!canTakeNotes || !selectedBattleId) return;
    setSelectedNoteId(null);
    setNoteEditor({ contextId: selectedBattleId, pin: null, coordinates: null, placing: true });
    setPanelCollapsed(true);
  }

  function editNote(pin: MapPin, move: boolean) {
    setNoteEditor({ contextId: pin.contextId, pin, coordinates: { latitude: pin.latitude, longitude: pin.longitude }, placing: move });
    setPanelCollapsed(move);
  }

  async function saveNote(draft: StudyNoteDraft) {
    if (!noteEditor?.coordinates) return;
    const position = { latitude: noteEditor.coordinates.latitude, longitude: noteEditor.coordinates.longitude };
    try {
      const saved = noteEditor.pin
        ? await updateNote.mutateAsync({ pin: noteEditor.pin, changes: { label: draft.label, description: draft.note, ...position } })
        : await createNote.mutateAsync({ label: draft.label, description: draft.note || undefined, ...position, pinYear: activeYear });
      setNoteEditor(null);
      setSelectedNoteId(saved.pinId);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.message ?? (noteEditor.pin ? 'Không cập nhật được ghi chú. Vui lòng thử lại.' : 'Không lưu được ghi chú. Vui lòng thử lại.'));
    }
  }

  async function confirmDelete() {
    const pin = pendingDelete;
    if (!pin) return;
    try {
      await deleteNote.mutateAsync(pin.pinId);
      setSelectedNoteId(null);
      setPendingDelete(null);
    } catch (e: any) {
      setPendingDelete(null);
      Alert.alert('Lỗi', e?.message ?? 'Không xóa được ghi chú. Vui lòng thử lại.');
    }
  }

  const showPanel = !!activeEvent;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} accessibilityLabel="Quay lại">
          <ArrowLeft size={20} color={TEXT} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.title}>Bản đồ trận đánh</Text>
          <Text style={s.subtitle} numberOfLines={1}>
            {eventsLoading || overviewLoading ? 'Đang tải trận đánh…' : `${battleMarkers.length} trận đánh làm nên lịch sử`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setListOpen(true)} style={s.iconBtn} accessibilityLabel="Danh sách trận đánh và ghi chú">
          <List size={20} color={TEXT} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <HistoricalLeafletMap
          ref={mapRef}
          battles={battleMarkers}
          notes={noteMarkers}
          selectedBattleId={selectedBattleId}
          selectedNoteId={selectedNoteId}
          draft={noteEditor?.coordinates ? { lat: noteEditor.coordinates.latitude, lng: noteEditor.coordinates.longitude } : null}
          placing={placing}
          onSelectBattle={(id) => chooseBattle(id)}
          onSelectNote={(id) => {
            const pin = studyNotes.find((p) => p.pinId === id);
            if (pin && !noteEditor) selectNote(pin);
          }}
          onMapPress={onMapPress}
        />

        {placing ? (
          <View style={s.pill} pointerEvents="none">
            <Bookmark size={15} color="#fff" />
            <Text style={s.pillText}>Chạm vào bản đồ để đặt ghi chú</Text>
          </View>
        ) : null}

        {eventsError ? (
          <View style={s.errorCard}>
            <Text style={s.errorText}>Không tải được dữ liệu bản đồ</Text>
            <TouchableOpacity onPress={() => void refetchEvents()}>
              <Text style={s.retry}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showPanel && activeEvent ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[s.panel, panelCollapsed && s.panelCollapsed]}
          >
            <View style={s.panelBar}>
              <TouchableOpacity
                onPress={() => setPanelCollapsed((c) => !c)}
                style={s.panelToggle}
                accessibilityLabel={panelCollapsed ? 'Mở rộng bảng thông tin' : 'Thu gọn bảng thông tin'}
              >
                {panelCollapsed ? <ChevronUp size={18} color={TEXT} /> : <ChevronDown size={18} color={TEXT} />}
                <Text style={s.panelBarTitle} numberOfLines={1}>{activeEvent.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => chooseBattle(null)} style={s.closeBtn} accessibilityLabel="Bỏ chọn trận đánh">
                <X size={18} color={TEXT} />
              </TouchableOpacity>
            </View>
            {!panelCollapsed ? (
              <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 4 }} keyboardShouldPersistTaps="handled">
                {noteEditor ? (
                  <StudyNoteForm
                    key={noteEditor.pin?.pinId ?? 'new'}
                    battleTitle={activeEvent.name}
                    yearLabel={battleYearLabel(activeEvent)}
                    initial={noteEditor.pin}
                    coordinates={noteEditor.coordinates}
                    placing={noteEditor.placing}
                    submitting={createNote.isPending || updateNote.isPending}
                    onPickOnMap={() => { setNoteEditor({ ...noteEditor, placing: true }); setPanelCollapsed(true); }}
                    onCancel={() => setNoteEditor(null)}
                    onSubmit={(draft) => void saveNote(draft)}
                  />
                ) : (
                  <BattlePanel
                    event={activeEvent}
                    pin={mainPin}
                    characters={characters}
                    charactersLoading={charactersLoading}
                    startingCharacterId={startingId}
                    onOpenCharacter={(c) => void startChat(c, activeEvent.id, activeEvent.name)}
                    onOpenDetail={() => router.push({ pathname: '/map/battle/[id]', params: { id: activeEvent.id } })}
                    onOpenContext={() => router.push(`/context/${activeEvent.id}`)}
                    notes={canTakeNotes ? {
                      notes: studyNotes,
                      loading: pinsLoading,
                      selectedId: selectedNoteId,
                      busy: notesBusy,
                      canAdd: !!mainPin,
                      onSelect: (pin) => (pin.pinId === selectedNoteId ? setSelectedNoteId(null) : selectNote(pin)),
                      onAdd: startNote,
                      onEdit: (pin) => editNote(pin, false),
                      onMove: (pin) => editNote(pin, true),
                      onDelete: setPendingDelete,
                    } : null}
                  />
                )}
              </ScrollView>
            ) : null}
          </KeyboardAvoidingView>
        ) : null}
      </View>

      <BattleListSheet
        visible={listOpen}
        battles={battleMarkers.map((b) => ({
          id: b.id,
          title: b.title,
          yearLabel: b.yearLabel,
          location: events.find((e) => e.id === b.id)?.location,
        }))}
        notes={allStudyNotes}
        showNotes={canTakeNotes}
        selectedBattleId={selectedBattleId}
        onClose={() => setListOpen(false)}
        onSelectBattle={(id) => { setListOpen(false); chooseBattle(id); }}
        onSelectNote={(note) => openStudyNote(note as StudyNoteListItem & MapCoordinates)}
      />

      <ConfirmModal
        visible={!!pendingDelete}
        title="Xóa ghi chú này?"
        message={pendingDelete ? `«${pendingDelete.label}» sẽ bị xóa vĩnh viễn khỏi bản đồ của bạn.` : undefined}
        confirmText="Xóa ghi chú"
        variant="danger"
        loading={deleteNote.isPending}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BORDER, backgroundColor: CARD,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  title: { color: TEXT, fontSize: 17, fontWeight: '800' },
  subtitle: { color: MUTED, fontSize: 12 },
  pill: {
    position: 'absolute', top: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: STUDY_NOTE_COLOR, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
  },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  errorCard: {
    position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center', gap: 8,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 16,
  },
  errorText: { color: TEXT, fontSize: 14, fontWeight: '700' },
  retry: { color: STUDY_NOTE_COLOR, fontSize: 13, fontWeight: '800' },
  panel: {
    position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '62%',
    backgroundColor: CARD, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: BORDER,
  },
  panelCollapsed: { maxHeight: 56 },
  panelBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  panelToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  panelBarTitle: { flex: 1, color: TEXT, fontSize: 14, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
});
