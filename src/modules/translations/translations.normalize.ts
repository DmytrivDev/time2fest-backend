// src/modules/translations/translations.normalize.ts

export function normalizeTranslation(item: any) {
  const attrs = item?.attributes ?? item;

  const country =
    attrs.country?.data?.attributes ??
    attrs.country ??
    null;

  const timeZone =
    attrs.time_zone?.data?.attributes ??
    attrs.time_zone ??
    null;

  return {
    id: item.id,
    name_uk: attrs.name_uk ?? '',
    name_en: attrs.name_en ?? '',
    name_es: attrs.name_es ?? '',
    name_fr: attrs.name_fr ?? '',

    videoId: attrs.videoid ?? null,

    country: country
      ? {
          slug: country.slug ?? '',
        }
      : null,

    timeZone: timeZone
      ? {
          code: timeZone.code ?? '',
        }
      : null,

    createdAt: attrs.createdAt,
    updatedAt: attrs.updatedAt,
  };
}
