/**
 * Dinh dang ngay gio / tien dung chung cho cac man hinh.
 * Ngay luon theo kieu Viet Nam: ngay truoc thang sau (dd/mm/yyyy), gio 24h (HH:mm).
 * Tu ghep chuoi thay vi toLocaleDateString('vi-VN') vi Intl tren Hermes khong on dinh
 * (nhieu may van ra kieu My mm/dd/yyyy).
 */

const pad = (n: number) => String(n).padStart(2, '0');

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

export const toDate = (value?: string | number | Date | null) => {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** dd/mm/yyyy, `fallback` ("—") khi khong co/sai dinh dang. */
export function formatDate(value?: string | number | Date | null, fallback = '—') {
  const d = toDate(value);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : fallback;
}

/** HH:mm (24h), `fallback` ("") khi khong co. */
export function formatTime(value?: string | number | Date | null, fallback = '') {
  const d = toDate(value);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : fallback;
}

/** HH:mm dd/mm/yyyy, "—" khi khong co. */
export function formatDateTime(value?: string | number | Date | null, fallback = '—') {
  const d = toDate(value);
  return d ? `${formatTime(d)} ${formatDate(d)}` : fallback;
}

/** "Thứ sáu, 20/11/2026". */
export function formatWeekdayDate(value?: string | number | Date | null, fallback = '—') {
  const d = toDate(value);
  return d ? `${WEEKDAYS[d.getDay()]}, ${formatDate(d)}` : fallback;
}

/** "Vừa xong" / "5 phút trước" / ... / ngay cu the neu qua 1 tuan. */
export function formatRelative(iso?: string | null) {
  const d = toDate(iso);
  if (!d) return '';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return formatDate(d);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}
