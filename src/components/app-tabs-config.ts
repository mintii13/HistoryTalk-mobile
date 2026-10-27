import { ClipboardCheck, Landmark, LibraryBig, Trophy, User, Users } from "lucide-react-native";

export type AppTab = {
  href: string;
  label: string;
  icon?: typeof Users;
  /** Tab o giua hien logo (trang chu cua role). */
  home?: boolean;
  /** Duong dan con thuoc tab khac (vd. /classes/materials thuoc tab Tu lieu, khong phai Lop hoc). */
  exclude?: string[];
  /** Duong dan khac cung thuoc tab nay (vd. ban do /map nam trong tab Su kien). */
  also?: string[];
};

export const CUSTOMER_TABS: AppTab[] = [
  { href: "/characters", label: "Nhân vật", icon: Users },
  // Giong muc "Sự kiện lịch sử" ben web: dong thoi gian, luoi va ban do tran danh.
  { href: "/context", label: "Sự kiện", icon: Landmark, also: ["/map"] },
  { href: "/", label: "Trang chủ", home: true },
  { href: "/quiz", label: "Quiz", icon: Trophy },
  { href: "/profile", label: "Hồ sơ", icon: User },
];

// Hoc sinh: "Không gian lớp học" o giua, thu vien HistoryTalk (su kien, nhan vat, quiz) mo tu tab Thư viện / trang lop hoc.
export const STUDENT_TABS: AppTab[] = [
  { href: "/assignments", label: "Bài tập", icon: ClipboardCheck },
  { href: "/classes/materials", label: "Tư liệu", icon: LibraryBig, also: ["/map/class"] },
  { href: "/classes", label: "Lớp học", home: true, exclude: ["/classes/materials"] },
  { href: "/context", label: "Thư viện", icon: Landmark, also: ["/map"], exclude: ["/map/class"] },
  { href: "/profile", label: "Hồ sơ", icon: User },
];

export function isTabActive(pathname: string, tab: AppTab) {
  const under = (p: string) => pathname === p || pathname.startsWith(`${p}/`);
  if (tab.exclude?.some(under)) return false;
  if (tab.also?.some(under)) return true;
  return tab.href === "/" ? pathname === "/" : under(tab.href);
}

/**
 * An tab bar khi dang lam quiz (chi thoat qua nut "Thoát"), trong 1 cuoc tro chuyen
 * (/chat/<sessionId>) va man tran danh (/map/battle/<id>) can toan bo chieu cao.
 */
export function shouldHideTabBar(pathname: string) {
  return (
    pathname === "/quiz/play" ||
    pathname.startsWith("/map/battle/") ||
    (pathname.startsWith("/chat/") && pathname !== "/chat/history")
  );
}
