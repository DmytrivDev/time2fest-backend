// src/modules/live/live.normalize.ts

export function normalizeLiveStream(item: any) {
  const attrs = item?.attributes ?? item;

  const country =
    attrs.country?.data?.attributes ??
    attrs.country ??
    null;

  const timeZone =
    attrs.time_zone?.data?.attributes ??
    attrs.time_zone ??
    null;

  const titleComponent = attrs.title ?? {};

  return {
    documentId: attrs.documentId ?? item.documentId ?? null,

    trstatus: attrs.trstatus ?? "prestart",

    title: {
      en: titleComponent.en ?? "",
      uk: titleComponent.uk ?? "",
      es: titleComponent.es ?? "",
      fr: titleComponent.fr ?? "",
    },

    active_asset_id: attrs.active_asset_id ?? null,

    mux_playback_id: attrs.mux_playback_id ?? null,

    // 🔥 ОСЬ ВАЖЛИВО
    live_playback_id: attrs.live_playback_id ?? null,

    country: country ? { slug: country.slug ?? "" } : null,

    timeZone: timeZone ? { code: timeZone.code ?? "" } : null,
  };
}
