// Service-specific additions the shared pages render generically:
// sections for the transcript PDF and items for the review page. The adult
// spine intake keeps everything in the shared steps, so there is nothing extra.

/** [{ title, rows: [[label, value], ...] }] for the transcript PDF, after the shared sections. */
export function pdfSections(/* intake */) {
  return [];
}

/** [{ label, value, step }] for the review page's summary, after the shared items. */
export function reviewItems(/* intake, t */) {
  return [];
}
