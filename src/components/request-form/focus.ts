/** Smooth scrolling unless the person asked for less motion (HANDOFF §6). */
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function scrollTo(element: HTMLElement, block: ScrollLogicalPosition = 'center') {
  element.scrollIntoView({ block, behavior: scrollBehavior() });
}

/** Move keyboard focus to an element and scroll it into view. */
export function focusElement(element: HTMLElement) {
  // preventScroll: focus() would jump instantly, so the scroll is done once, by scrollTo.
  element.focus({ preventScroll: true });
  scrollTo(element);
}

export function focusById(id: string) {
  const element = document.getElementById(id);
  if (element) focusElement(element);
}

/** True while someone is typing in a text box; moving focus then would take the keyboard away mid-word. */
export function isTyping() {
  return document.activeElement?.matches('textarea, input:not([type="radio"], [type="checkbox"])') ?? false;
}
