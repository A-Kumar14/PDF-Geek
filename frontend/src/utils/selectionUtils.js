/**
 * Get selection rects relative to a container element, normalized by dividing by scale.
 * Used for PDF highlights where we store rects at scale=1.
 */
export function getSelectionRectsRelativeTo(container, scale = 1) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.toString().trim().length === 0) return null;

  const range = sel.getRangeAt(0);
  const containerRect = container.getBoundingClientRect();
  const clientRects = range.getClientRects();

  const rects = [];
  for (let i = 0; i < clientRects.length; i++) {
    const r = clientRects[i];
    rects.push({
      x: (r.left - containerRect.left) / scale,
      y: (r.top - containerRect.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
    });
  }

  return {
    text: sel.toString(),
    rects,
  };
}

/**
 * Get character offsets of the current selection within a container's text content.
 * Used for TextViewer highlights with <mark> tags.
 */
export function getSelectionOffsets(container) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.toString().trim().length === 0) return null;

  const range = sel.getRangeAt(0);

  // Calculate the start offset by creating a range from the container start to the selection start
  const preRange = document.createRange();
  preRange.setStart(container, 0);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const endOffset = startOffset + sel.toString().length;

  return {
    text: sel.toString(),
    startOffset,
    endOffset,
  };
}

/**
 * Get the bounding rect of the current selection in viewport coordinates (for toolbar positioning).
 */
export function getSelectionBoundingRect() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.toString().trim().length === 0) return null;
  return sel.getRangeAt(0).getBoundingClientRect();
}
