import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ARCHIVE } from '@/components/archive';
import { Text } from '@/components/ui/text';
import { TEXT } from '@/constants/palette';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

/**
 * Nut chuyen che do co chu (giong "Danh sách đề | Lịch sử làm bài" ben web):
 * nen xam nhat, o dang chon noi len mau giay — gon hon cap icon khong nhan.
 */
export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.wrap, style]} accessibilityRole="tablist">
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={[s.item, active && s.itemActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            {Icon ? <Icon size={14} color={active ? TEXT : ARCHIVE.tertiary} strokeWidth={2} /> : null}
            <Text style={[s.label, active && s.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 2,
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(17,17,17,0.05)',
  },
  item: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  itemActive: {
    backgroundColor: ARCHIVE.elevated,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  label: { color: ARCHIVE.tertiary, fontSize: 13, fontWeight: '600' },
  labelActive: { color: TEXT },
});
