import { useEffect } from "react";

export function useDatabaseAlign(containerSelector = ".simple-editor-center") {
  useEffect(() => {
    const align = () => {
      const block = document.querySelector<HTMLElement>(".top-level-block");
      if (!block) return;
      const blockLeft = block.getBoundingClientRect().left;

      document.querySelectorAll<HTMLElement>(".db-node").forEach((node) => {
        const container = node.querySelector<HTMLElement>(".db-container");
        if (!container) return;
        container.style.marginLeft = "0px";

        // Where the database would start with no padding and no sideways
        // scroll. Measured from the current position instead of resetting
        // the padding to 0 first: that reset shrank the scroll width (the
        // table jumped back to its start), and measuring while scrolled
        // added the scroll distance to the padding (the toolbar and table
        // slid right). Both happened whenever the table changed width, e.g.
        // when Add Property opens.
        const currentPad = parseFloat(getComputedStyle(node).paddingLeft) || 0;
        const unpaddedLeft =
          container.getBoundingClientRect().left - currentPad + node.scrollLeft;
        // Pad the SCROLLER — included in scrollWidth, so scroll reaches the end.
        const pad = Math.max(0, blockLeft - unpaddedLeft);
        if (Math.abs(pad - currentPad) > 0.5) {
          node.style.paddingLeft = `${pad}px`;
        }
      });
    };

    align();

    const ro = new ResizeObserver(align);
    const wrapper = document.querySelector(containerSelector);
    if (wrapper) ro.observe(wrapper);
    document
      .querySelectorAll<HTMLElement>(".db-container")
      .forEach((c) => ro.observe(c));

    return () => ro.disconnect();
  }, [containerSelector]);
}
