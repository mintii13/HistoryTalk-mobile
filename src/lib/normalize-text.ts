/** Bo dau tieng Viet + chu thuong de tim kiem khong phan biet dau (giong web normalizeText). */
export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
