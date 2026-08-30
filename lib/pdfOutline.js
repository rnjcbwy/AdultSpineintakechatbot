// ============================================================================
// PDF outline (bookmark) construction.
//
// pdf-lib has no high-level API for outlines, so the dictionaries are built by
// hand. Isolated here so it can be unit-tested in Node without dragging in the
// browser-only parts of the packet builder.
// ============================================================================

import { PDFName, PDFNumber, PDFArray, PDFDict, PDFHexString, PDFNull } from 'pdf-lib';

/**
 * Attach a flat outline tree to `pdfDoc`.
 * @param {PDFDocument} pdfDoc
 * @param {Array<{title: string, pageIndex: number}>} entries
 * @param {number} pageHeight - used for the /XYZ destination's top coordinate
 */
export function addOutline(pdfDoc, entries, pageHeight = 792) {
  if (!entries || !entries.length) return;

  const context = pdfDoc.context;
  const outlinesRef = context.nextRef();
  const itemRefs = entries.map(() => context.nextRef());

  entries.forEach((entry, i) => {
    const pageRef = pdfDoc.getPage(entry.pageIndex).ref;

    // Destination: [page /XYZ left top zoom]. Null left/zoom preserves the
    // viewer's current horizontal scroll and zoom level.
    const dest = PDFArray.withContext(context);
    dest.push(pageRef);
    dest.push(PDFName.of('XYZ'));
    dest.push(PDFNull);
    dest.push(PDFNumber.of(pageHeight));
    dest.push(PDFNull);

    const map = new Map();
    map.set(PDFName.of('Title'), PDFHexString.fromText(entry.title));
    map.set(PDFName.of('Parent'), outlinesRef);
    map.set(PDFName.of('Dest'), dest);
    if (i > 0) map.set(PDFName.of('Prev'), itemRefs[i - 1]);
    if (i < entries.length - 1) map.set(PDFName.of('Next'), itemRefs[i + 1]);

    context.assign(itemRefs[i], PDFDict.fromMapWithContext(map, context));
  });

  const rootMap = new Map();
  rootMap.set(PDFName.of('Type'), PDFName.of('Outlines'));
  rootMap.set(PDFName.of('First'), itemRefs[0]);
  rootMap.set(PDFName.of('Last'), itemRefs[itemRefs.length - 1]);
  rootMap.set(PDFName.of('Count'), PDFNumber.of(entries.length));
  context.assign(outlinesRef, PDFDict.fromMapWithContext(rootMap, context));

  pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesRef);
  pdfDoc.catalog.set(PDFName.of('PageMode'), PDFName.of('UseOutlines'));
}
