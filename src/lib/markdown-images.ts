// Tu lieu lich su trong tin nhan AI co dang ![mo ta](/historical-images/<folder>/<file>).
// Web tra duong dan tuong doi nay qua rewrite cua Next (next.config.ts); mobile khong
// co rewrite nen phai tu ghep thanh URL public cua Supabase.
const SUPABASE_URL = (
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rvccamoxvumyzvowzsmo.supabase.co'
).replace(/\/+$/, '');

const COMPLETE_IMAGE = /!\[[^\]]*\]\([^)]*\)/g;
const BROKEN_IMAGE_SPACING = /!\[([^\]]*)\]\s+\(([^)]+)\)/g;
const TRUNCATED_IMAGE_AT_END = /!\[[^\]]*(?:\](?:\([^)]*)?)?$/;
const RELATIVE_HISTORICAL_IMAGE = /^\/historical-images\/(staging|published)\/(.+)$/;

/** Doi duong dan anh thanh URL tai duoc; tra null neu khong phai duong dan hop le. */
export function resolveMarkdownImageUrl(url: string): string | null {
  const trimmed = url.trim();
  const relative = trimmed.match(RELATIVE_HISTORICAL_IMAGE);
  if (relative) {
    return `${SUPABASE_URL}/storage/v1/object/public/documents/${relative[1]}/historical-images/${relative[2]}`;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

/** Dua moi the anh ra dong rieng va bo the anh dang do (vd. bi cat khi thu gon tin nhan). */
export function isolateMarkdownImages(text: string): string {
  return text
    .replace(BROKEN_IMAGE_SPACING, '![$1]($2)')
    .replace(TRUNCATED_IMAGE_AT_END, '')
    .replace(/[ \t]*(!\[[^\]]*\]\([^)]*\))[ \t]*/g, '\n$1\n')
    .trim();
}

/** Bo the anh o nhung cho chi hien thi duoc van ban thuan. */
export function stripMarkdownImages(text: string): string {
  return text
    .replace(BROKEN_IMAGE_SPACING, '![$1]($2)')
    .replace(COMPLETE_IMAGE, '')
    .replace(TRUNCATED_IMAGE_AT_END, '');
}

/** Bo anh va URL truoc khi gui sang TTS de giong doc khong doc duong dan. Giong logic o web va BE. */
export function sanitizeForSpeech(text: string): string {
  return stripMarkdownImages(text)
    .replace(/\/historical-images\/\S+/gi, '')
    .replace(/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)\)?/gi, '')
    .replace(/\{\{IMG_\d+\}\}/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\[\s*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
