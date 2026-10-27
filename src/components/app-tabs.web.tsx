import { Slot, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { CUSTOMER_TABS, STUDENT_TABS, isTabActive, shouldHideTabBar } from "@/components/app-tabs-config";
import { ScreenBackdrop } from "@/components/screen-backdrop";
import { TabButton } from "@/components/tab-button";
import { BG, BORDER, CARD } from "@/constants/palette";
import { useAuthStore } from "@/features/auth/store";

const TAB_BAR_HORIZONTAL_PADDING = 16;

export default function AppTabs() {
  const pathname = usePathname();
  const tabs = useAuthStore((s) => s.user?.role) === "SCHOOL_STUDENT" ? STUDENT_TABS : CUSTOMER_TABS;

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
      <View style={styles.content}>
        <ScreenBackdrop />
        <Slot />
      </View>

      <Animated.View
        onLayout={(e) => setBarHeight(e.nativeEvent.layout.height)}
        style={[styles.bar, barAnimStyle, { pointerEvents: hideTabBar ? "none" : "auto" }]}
      >
        <View style={styles.inner}>
          {tabs.map((tab) => (
            <TabButton
              key={tab.href}
              href={tab.href}
              label={tab.label}
              icon={tab.icon}
              isHome={tab.home}
              liftOffset={-5}
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
    paddingBottom: 5,
    paddingHorizontal: TAB_BAR_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  inner: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
});
