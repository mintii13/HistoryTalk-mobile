import { Coins, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { TextInput } from '@/components/ui/text-input';

import { Text } from '@/components/ui/text';
import { AMBER, BG, BORDER, CARD, GREEN, MUTED, ORANGE, RED, TEXT, TEXT2 } from '@/constants/palette';
import { localDateKey, useMyTokenRequests, useRequestTokens } from '@/features/classroom/hooks';
import { BOOST_MAX_TOKENS, BOOST_MIN_TOKENS, BOOST_REASON_MAX } from '@/features/classroom/types';
import { ApiError } from '@/lib/api-client';

const PRESETS = [500, 1000, 2000, 5000];

/** Hoc sinh xin them token AI trong ngay (giong web token-boost-request-dialog.tsx). */
export function TokenBoostModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const requests = useMyTokenRequests();
  const request = useRequestTokens();
  const [amount, setAmount] = useState('1000');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const today = localDateKey();
  const pendingToday = (requests.data ?? []).find(
    (r) => r.requestDate === today && (r.status === 'PENDING' || r.status === 'PENDING_ADMIN'),
  );

  function close() {
    setError(null);
    setDone(false);
    onClose();
  }

  function submit() {
    const tokens = Number(amount);
    if (!Number.isInteger(tokens) || tokens < BOOST_MIN_TOKENS || tokens > BOOST_MAX_TOKENS) {
      setError(`Số token phải là số nguyên từ ${BOOST_MIN_TOKENS.toLocaleString('vi-VN')} đến ${BOOST_MAX_TOKENS.toLocaleString('vi-VN')}.`);
      return;
    }
    if (!reason.trim()) {
      setError('Hãy ghi lý do để thầy cô xem xét.');
      return;
    }
    setError(null);
    request.mutate(
      { requestedTokens: tokens, reason: reason.trim() },
      {
        onSuccess: () => {
          setDone(true);
          setReason('');
        },
        onError: (e) => {
          setError(
            e instanceof ApiError && e.status === 409
              ? 'Bạn đã có một yêu cầu đang chờ duyệt hôm nay. Hãy chờ thầy cô xem xét nhé.'
              : e.message,
          );
        },
      },
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.sheetWrap} pointerEvents="box-none">
        <View style={s.sheet}>
          <View style={s.header}>
            <Coins size={20} color={ORANGE} />
            <Text style={s.title}>Xin thêm token hôm nay</Text>
            <TouchableOpacity onPress={close} hitSlop={10} accessibilityLabel="Đóng">
              <X size={20} color={MUTED} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
            {done ? (
              <View style={[s.notice, { borderColor: `${GREEN}55`, backgroundColor: `${GREEN}12` }]}>
                <Text style={[s.noticeTitle, { color: GREEN }]}>Đã gửi yêu cầu xin thêm token</Text>
                <Text style={s.noticeText}>Thầy cô phụ trách lớp sẽ xem và duyệt trong hôm nay.</Text>
              </View>
            ) : pendingToday ? (
              <View style={[s.notice, { borderColor: `${AMBER}55`, backgroundColor: `${AMBER}12` }]}>
                <Text style={[s.noticeTitle, { color: AMBER }]}>Yêu cầu hôm nay đang chờ duyệt</Text>
                <Text style={s.noticeText}>
                  Bạn đã xin {pendingToday.requestedTokens.toLocaleString('vi-VN')} token. Mỗi ngày chỉ gửi được một yêu cầu.
                </Text>
              </View>
            ) : (
              <>
                <Text style={s.label}>Số token muốn xin</Text>
                <View style={s.presets}>
                  {PRESETS.map((p) => {
                    const active = Number(amount) === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setAmount(String(p))}
                        style={[s.preset, active && { backgroundColor: ORANGE, borderColor: ORANGE }]}
                      >
                        <Text style={[s.presetText, active && { color: '#fff' }]}>{p.toLocaleString('vi-VN')}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={s.input}
                  placeholder="1000"
                  placeholderTextColor={MUTED}
                />
                <Text style={s.helper}>
                  Từ {BOOST_MIN_TOKENS.toLocaleString('vi-VN')} đến {BOOST_MAX_TOKENS.toLocaleString('vi-VN')} token. Token được duyệt chỉ dùng trong hôm nay.
                </Text>

                <Text style={s.label}>Lý do</Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  maxLength={BOOST_REASON_MAX}
                  multiline
                  style={[s.input, { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="Vd: Em cần trò chuyện thêm với nhân vật để hoàn thành bài tập."
                  placeholderTextColor={MUTED}
                />
                <Text style={[s.helper, { textAlign: 'right' }]}>{reason.length}/{BOOST_REASON_MAX}</Text>
              </>
            )}

            {error ? <Text style={s.error}>{error}</Text> : null}
          </ScrollView>

          {done || pendingToday ? (
            <TouchableOpacity onPress={close} style={s.submit} activeOpacity={0.8}>
              <Text style={s.submitText}>Đóng</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={submit} disabled={request.isPending} style={[s.submit, request.isPending && { opacity: 0.6 }]} activeOpacity={0.8}>
              {request.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Gửi yêu cầu</Text>}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%', backgroundColor: BG, borderTopLeftRadius: 12, borderTopRightRadius: 12,
    padding: 20, paddingBottom: 32, gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, color: TEXT, fontSize: 17, fontWeight: '800' },
  label: { color: TEXT, fontSize: 14, fontWeight: '700' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, minHeight: 36, justifyContent: 'center',
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
  },
  presetText: { color: TEXT2, fontSize: 13, fontWeight: '700' },
  input: {
    minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: CARD,
    paddingHorizontal: 14, color: TEXT, fontSize: 15,
  },
  helper: { color: MUTED, fontSize: 12, marginTop: -6 },
  notice: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 4 },
  noticeTitle: { fontSize: 14, fontWeight: '800' },
  noticeText: { color: TEXT2, fontSize: 13, lineHeight: 19 },
  error: { color: RED, fontSize: 13, fontWeight: '600' },
  submit: { minHeight: 50, borderRadius: 10, backgroundColor: ORANGE, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
