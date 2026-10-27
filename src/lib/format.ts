/** Dinh dang ngay gio / tien dung chung cho cac man hinh (locale vi-VN). */

const toDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** dd/mm/yyyy, "—" khi khong co/sai dinh dang. */
export function formatDate(iso?: string | null) {
  return toDate(iso)?.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) ?? '—';
}

/** Ngay + gio day du theo vi-VN, "—" khi khong co. */
export function formatDateTime(iso?: string | null) {
  return toDate(iso)?.toLocaleString('vi-VN') ?? '—';
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
  return d.toLocaleDateString('vi-VN');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}
