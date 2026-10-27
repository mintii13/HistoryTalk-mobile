import { Slot, usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { CUSTOMER_TABS, STUDENT_TABS, isTabActive, shouldHideTabBar } from "@/components/app-tabs-config";
import { ScreenBackdrop } from "@/components/screen-backdrop";
import { TabButton } from "@/components/tab-button";
import { BG, BORDER, CARD } from "@/constants/palette";
import { useAvatarSync } from "@/features/auth/hooks/use-avatar-sync";
import { useAuthStore } from "@/features/auth/store";
import { useRegisterPush } from "@/features/notifications/hooks/use-register-push";
import { addNotificationTapListener } from "@/lib/notifications";
import { WidgetSync } from "@/widgets/widget-sync";

const TAB_BAR_HORIZONTAL_PADDING = 12;

export default function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const tabs = useAuthStore((s) => s.user?.role) === "SCHOOL_STUDENT" ? STUDENT_TABS : CUSTOMER_TABS;
  useAvatarSync();
  useRegisterPush(isAuthenticated);

  // Bam vao push notification (tu background/killed hoac tu foreground) ->
  // dieu huong theo `data.route` ma backend luon kem trong payload.
  useEffect(() => {
    const sub = addNotificationTapListener((route) => router.push(route as never));
    return () => sub.remove();
  }, [router]);

  const hideTabBar = shouldHideTabBar(pathname);
  const hideProgress = useSharedValue(hideTabBar ? 1 : 0);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    hideProgress.value = withTiming(hideTabBar ? 1 : 0, { duration: 250 });
  }, [hideTabBar, hideProgress]);

  const barAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hideProgress.value * barHeight }],
    marginBottom: -hideProgress.value * barHeight,
  }));

  return (
    <View style={styles.root}>
      <WidgetSync />
      <View style={styles.content}>
        <ScreenBackdrop />
        <Slot />
      </View>

      <Animated.View
        onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
        pointerEvents={hideTabBar ? "none" : "auto"}
        style={[
          styles.bar,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            paddingLeft: Math.max(insets.left, TAB_BAR_HORIZONTAL_PADDING),
            paddingRight: Math.max(insets.right, TAB_BAR_HORIZONTAL_PADDING),
          },
          barAnimStyle,
        ]}
      >
        <View style={styles.inner}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.href}
              href={tab.href}
              label={tab.label}
              icon={tab.icon}
              isHome={tab.home}
              liftOffset={6}
              active={isTabActive(pathname, tab)}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  bar: {
    alignItems: "center",
    backgroundColor: CARD,
    borderTopColor: BORDER,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  inner: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
