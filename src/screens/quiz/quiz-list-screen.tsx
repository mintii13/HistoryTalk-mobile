import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, Clock, History, Search, Star, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/empty-state";
import { ChipScroller, PageHeading } from "@/components/archive";
import { HeaderIconButton } from "@/components/screen-header";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { TextInput } from "@/components/ui/text-input";
import {
  AMBER,
  BORDER,
  CARD,
  FontSize,
  FontWeight,
  GREEN,
  MUTED,
  ORANGE,
  ORANGE_DARK,
  RED,
  SURFACE,
  TEXT,
} from "@/constants/palette";
import { AppFonts } from "@/constants/theme";
import { useAuthStore } from "@/features/auth/store";
import { ERA_COLORS, ERA_LABELS } from "@/features/characters/types";
import { useQuizzes } from "@/features/quiz/hooks/use-quizzes";
import type { QuizEra, QuizLevel, QuizSummary } from "@/features/quiz/types";

// ─── filter config ────────────────────────────────────────────────────────────
type EraFilter = QuizEra;
type LevelFilter = QuizLevel | "ALL";

const ERA_FILTER: { key: EraFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "ANCIENT", label: ERA_LABELS.ANCIENT },
  { key: "MEDIEVAL", label: ERA_LABELS.MEDIEVAL },
  { key: "MODERN", label: ERA_LABELS.MODERN },
  { key: "CONTEMPORARY", label: ERA_LABELS.CONTEMPORARY },
];

const LEVEL_FILTER: { key: LevelFilter; label: string; color: string }[] = [
  { key: "ALL", label: "Tất cả", color: ORANGE },
  { key: "EASY", label: "Dễ", color: GREEN },
  { key: "MEDIUM", label: "Trung bình", color: AMBER },
  { key: "HARD", label: "Khó", color: RED },
];

const LEVEL_LABELS: Record<QuizLevel, string> = {
  EASY: "Dễ",
  MEDIUM: "Trung bình",
  HARD: "Khó",
};

// ─── card ─────────────────────────────────────────────────────────────────────
// Thang do do kho 3 vach giong quiz-card ben web: so vach + mau doc nhanh.
const LEVEL_METER: Record<QuizLevel, { steps: number; color: string; text: string }> = {
  EASY: { steps: 1, color: GREEN, text: GREEN },
  MEDIUM: { steps: 2, color: ORANGE, text: ORANGE_DARK },
  HARD: { steps: 3, color: RED, text: RED },
};

function LevelMeter({ level }: { level: QuizLevel }) {
  const meter = LEVEL_METER[level] ?? LEVEL_METER.MEDIUM;
  return (
    <View style={s.meta}>
      <View style={s.meterBars}>
        {[7, 10, 13].map((h, i) => (
          <View
            key={h}
            style={[s.meterBar, { height: h, backgroundColor: i < meter.steps ? meter.color : "rgba(17,17,17,0.32)" }]}
          />
        ))}
      </View>
      <Text style={[s.metaText, { color: meter.text, fontWeight: "600" }]}>{LEVEL_LABELS[level] ?? level}</Text>
    </View>
  );
}

function QuizCard({
  quiz,
  onPress,
}: {
  quiz: QuizSummary;
  onPress: () => void;
}) {
  const eraLabel = ERA_LABELS[quiz.era as keyof typeof ERA_LABELS] ?? quiz.era;
  const eyebrow = [eraLabel, quiz.contextTitle].filter(Boolean).join(" · ");
  const minutes = quiz.durationSeconds ? Math.max(1, Math.round(quiz.durationSeconds / 60)) : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.card} accessibilityLabel={`Làm bài: ${quiz.title}`}>
      <Text style={s.eyebrow} numberOfLines={1}>{eyebrow}</Text>
      <Text style={s.cardTitle} numberOfLines={3}>{quiz.title}</Text>
      <View style={s.cardFooter}>
        <View style={s.metaRow}>
          <LevelMeter level={quiz.level} />
          {minutes ? (
            <View style={s.meta}>
              <Clock size={13} color={MUTED} />
              <Text style={s.metaText}>{minutes} phút</Text>
            </View>
          ) : null}
          {quiz.playCount > 0 ? (
            <View style={s.meta}>
              <Users size={13} color={MUTED} />
              <Text style={s.metaText}>{quiz.playCount.toLocaleString("vi-VN")}</Text>
            </View>
          ) : null}
          {quiz.rating ? (
            <View style={s.meta}>
              <Star size={12} color={AMBER} fill={AMBER} strokeWidth={0} />
              <Text style={s.metaText}>{quiz.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <View style={s.meta}>
          <Text style={s.startText}>Làm bài</Text>
          <ArrowRight size={14} color={ORANGE} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function QuizSkeletons() {
  return (
    <View style={{ paddingHorizontal: 20, gap: 12 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} style={{ height: 96, borderRadius: 12 }} />
      ))}
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────
export default function QuizListScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { contextId: contextIdParam } = useLocalSearchParams<{ contextId?: string }>();
  const initialContextId = Array.isArray(contextIdParam) ? contextIdParam[0] : contextIdParam;

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [era, setEra] = useState<EraFilter>("ALL");
  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [contextId, setContextId] = useState<string>(initialContextId ?? "ALL");

  // Den tu banner "Kiem tra kien thuc" o man chi tiet boi canh — moi lan
  // nhan lai voi 1 contextId khac (vd tu 1 boi canh khac), ap lai filter nay
  // ngay ca khi man hinh quiz da duoc mount san (tab dieu huong khong remount).
  // Dieu chinh state ngay khi render thay vi trong effect (khong render thua).
  const [appliedContextId, setAppliedContextId] = useState(initialContextId);
  if (initialContextId !== appliedContextId) {
    setAppliedContextId(initialContextId);
    if (initialContextId) setContextId(initialContextId);
  }

  const { data: quizzes, isLoading, isError, refetch, isRefetching } = useQuizzes(query || undefined);

  // Danh sach "tran danh" (boi canh lich su) suy ra tu chinh cac quiz da tai,
  // khong can goi them API rieng.
  const contextFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const q of quizzes ?? []) {
      if (q.contextId && q.contextTitle && !seen.has(q.contextId)) {
        seen.set(q.contextId, q.contextTitle);
      }
    }
    const sorted = Array.from(seen.entries())
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([key, label]) => ({ key, label }));
    return [{ key: "ALL", label: "Tất cả" }, ...sorted];
  }, [quizzes]);

  const filtered = useMemo(() => {
    if (!quizzes) return [];
    return quizzes.filter((q) => {
      const eraMatch = era === "ALL" || q.era === era;
      const levelMatch = level === "ALL" || q.level === level;
      const contextMatch = contextId === "ALL" || q.contextId === contextId;
      return eraMatch && levelMatch && contextMatch;
    });
  }, [quizzes, era, level, contextId]);

  function submitSearch() {
    setQuery(search.trim());
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }} edges={["top"]}>
      <PageHeading
        style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}
        title="Câu đố lịch sử"
        description="Chọn một bộ đề, làm nhanh theo bối cảnh lịch sử và xem lại đáp án ngay sau khi nộp bài."
        right={
          isAuthenticated ? (
            <HeaderIconButton label="Lịch sử làm bài" onPress={() => router.push("/quiz/history")}>
              <History size={19} color={TEXT} strokeWidth={2} />
            </HeaderIconButton>
          ) : null
        }
      />

      {/* search */}
      <View style={s.searchWrap}>
        <Search size={15} color={MUTED} strokeWidth={2} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={submitSearch}
          placeholder="Tìm bộ câu hỏi..."
          placeholderTextColor={MUTED}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity
            onPress={() => {
              setSearch("");
              setQuery("");
            }}
          >
            <Text style={{ color: MUTED, fontSize: 13, paddingLeft: 8 }}>
              ×
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* era filter */}
      <View style={{ zIndex: 20, marginBottom: 12 }}>
      <ChipScroller style={{ paddingVertical: 3 }}>
        {ERA_FILTER.map(({ key, label }) => {
          const active = era === key;
          const ec = key !== "ALL" ? ERA_COLORS[key as keyof typeof ERA_COLORS] : null;
          const activeBg = ec ? `${ec.text}18` : `${ORANGE}18`;
          const activeBorder = ec ? `${ec.text}55` : `${ORANGE}55`;
          const activeText = ec?.text ?? ORANGE;
          return (
            <Pressable
              key={key}
              onPress={() => setEra(key)}
              style={[
                s.pill,
                active
                  ? { backgroundColor: activeBg, borderColor: activeBorder }
                  : { backgroundColor: SURFACE, borderColor: BORDER },
              ]}
            >
              <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: active ? activeText : MUTED }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ChipScroller>
      </View>

      {/* count + difficulty/context filter */}
      <View style={s.countBar}>
        <Text style={s.countText}>{filtered.length} bộ câu hỏi</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <FilterDropdown
            label="Trận đánh"
            options={contextFilterOptions}
            value={contextId}
            onChange={setContextId}
          />
          <FilterDropdown
            label="Độ khó"
            options={LEVEL_FILTER}
            value={level}
            onChange={(v) => setLevel(v as LevelFilter)}
          />
        </View>
      </View>

      {/* list */}
      {isLoading ? (
        <View style={{ marginTop: 4 }}>
          <QuizSkeletons />
        </View>
      ) : isError ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: MUTED }}>Không thể tải bộ câu hỏi</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(q) => q.quizId}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 120,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            query || era !== "ALL" || level !== "ALL" || contextId !== "ALL" ? (
              <EmptyState mood="thinking" title="Không tìm thấy bộ đề phù hợp" description="Thử từ khoá khác hoặc bỏ bớt bộ lọc." />
            ) : (
              <EmptyState title="Chưa có bộ câu hỏi" />
            )
          }
          renderItem={({ item }) => (
            <QuizCard
              quiz={item}
              onPress={() =>
                router.push({
                  pathname: "/quiz/[id]",
                  params: { id: item.quizId },
                })
              }
            />
          )}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, marginLeft: 10, color: TEXT, fontSize: FontSize.md },

  countBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
    zIndex: 10,
  },
  countText: { color: MUTED, fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    height: 32,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eyebrow: { color: MUTED, fontSize: 13 },
  cardTitle: { marginTop: 4, color: TEXT, fontFamily: AppFonts.title, fontSize: 17, lineHeight: 22 },
  cardFooter: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  metaRow: { flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 12, rowGap: 4 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: MUTED, fontSize: 13 },
  meterBars: { flexDirection: "row", alignItems: "flex-end", gap: 3, marginRight: 4 },
  meterBar: { width: 5, borderRadius: 1 },
  startText: { color: ORANGE, fontSize: 13, fontWeight: "600" },
});
