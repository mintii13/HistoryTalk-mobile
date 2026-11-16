import { Image } from 'expo-image';
import { useEffect, useState } from 'react';

/** Ti le rong / cao cua anh nen (null khi dang tai, 1 khi loi) — de cham diem va dung mat phang ve. */
export function useImageAspect(url: string | null | undefined) {
  const [state, setState] = useState<{ url: string; aspect: number } | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    Image.loadAsync(url)
      .then((ref) => {
        if (!cancelled) setState({ url, aspect: ref.width && ref.height ? ref.width / ref.height : 1 });
      })
      .catch(() => {
        if (!cancelled) setState({ url, aspect: 1 });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return state && state.url === url ? state.aspect : null;
}
