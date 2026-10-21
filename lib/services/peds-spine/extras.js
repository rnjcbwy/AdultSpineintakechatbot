// Pediatric additions the shared pages render generically.

/** [{ title, rows: [[label, value], ...] }] for the transcript PDF, after the shared sections. */
export function pdfSections(/* intake */) {
  return [];
}

/** [{ label, value, step }] for the review page's summary, after the shared items. */
export function reviewItems(/* intake, t */) {
  return [];
}
