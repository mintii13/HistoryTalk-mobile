/**
 * Cac "mua" ngay le de trang tri mascot va loi chao (giong lib/season.ts ben web).
 * Ban mobile bo phan xem thu qua ?season= vi app khong co thanh dia chi.
 */
export type Season = 'tet' | 'reunification' | 'national' | 'mid-autumn' | 'teacher';

// Le am lich khong theo duong lich — ngay theo tung nam (Tết = mùng 1, Trung thu = rằm tháng 8).
const TET: Record<number, string> = { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03' };
const MID_AUTUMN: Record<number, string> = { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' };

export const SEASON_GREETING: Record<Season, string> = {
  tet: 'Chúc mừng năm mới! Đầu xuân học sử, cả năm hanh thông nhé 🌼',
  reunification: 'Mừng ngày Giải phóng miền Nam, thống nhất đất nước 30/4 🇻🇳',
  national: 'Mừng Quốc khánh 2/9! Cùng ôn lại bản Tuyên ngôn Độc lập nhé 🇻🇳',
  'mid-autumn': 'Trung thu vui vẻ! Rước đèn ông sao, nghe kể chuyện sử nào 🏮',
  teacher: 'Mừng ngày Nhà giáo Việt Nam 20/11 — tri ân thầy cô! 💐',
};

function within(now: Date, mmdd: string | undefined, before: number, after: number) {
  if (!mmdd) return false;
  const [m, d] = mmdd.split('-').map(Number);
  const center = new Date(now.getFullYear(), m - 1, d);
  const diff = (now.getTime() - center.getTime()) / 86_400_000;
  return diff >= -before && diff <= after;
}

export function getSeason(now = new Date()): Season | null {
  const year = now.getFullYear();
  if (within(now, TET[year], 7, 7)) return 'tet';
  if (within(now, '04-30', 5, 1)) return 'reunification';
  if (within(now, '09-02', 5, 1)) return 'national';
  if (within(now, MID_AUTUMN[year], 5, 1)) return 'mid-autumn';
  if (within(now, '11-20', 3, 0)) return 'teacher';
  return null;
}
