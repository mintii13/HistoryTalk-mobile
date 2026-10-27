import { Image } from "expo-image";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { BG } from "@/constants/palette";

const pattern = require("../../assets/images/copper-drum-pattern.webp");

/**
 * Nen hoa tiet trong dong (Dong Son) mo, dat phia sau toan bo cac man hinh chinh
 * (xem AppTabs) — man hinh ben tren phai de backgroundColor "transparent" o
 * container goc thi hoa tiet moi lo ra duoc.
 * Giong web (--bg-content-decorated): mat trong lon, lech xuong goc duoi, chi lo mot phan.
 */
export function ScreenBackdrop() {
  const { width, height } = useWindowDimensions();
  const size = Math.max(width * 1.5, 560);
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      <Image
        source={pattern}
        contentFit="contain"
        style={[styles.drum, { width: size, height: size, left: width * 0.3 - size / 2, top: height - size * 0.62 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BG, overflow: "hidden" },
  drum: {
    position: "absolute",
    opacity: 0.1,
    // Anh goc co nen vuong bao quanh hinh tron — bo tron de khong lo canh vuong.
    borderRadius: 9999,
  },
});
