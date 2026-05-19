import { getActiveLanguage } from './index';

type CourseLabelMap = Record<string, string>;

const cache: Partial<Record<string, CourseLabelMap>> = {};

async function loadCourseLabels(lang: string): Promise<CourseLabelMap> {
  if (cache[lang]) return cache[lang]!;
  try {
    const mod = await import(`./locales/${lang}.json`);
    const map = (mod.default as { course_labels?: CourseLabelMap }).course_labels ?? {};
    cache[lang] = map;
    return map;
  } catch {
    return {};
  }
}

/** Translate menu course label from backend when a mapping exists. */
export function translateCourseLabel(label: string, lang?: string): string {
  const code = lang ?? getActiveLanguage();
  const map = cache[code];
  if (map && map[label]) return map[label];
  return label;
}

export function clearCourseLabelCache(): void {
  for (const key of Object.keys(cache)) {
    delete cache[key];
  }
}

/** Preload course label map for active language (call on language change). */
export async function preloadCourseLabels(lang: string): Promise<void> {
  clearCourseLabelCache();
  await loadCourseLabels(lang);
}
