# ReviewEditPopover — Repositioning Logic

There are five distinct concerns in the repositioning logic in `src/components/common/ReviewEditPopover.vue`.

---

## 1. `clampPopoverPosition()` — the core layout fix

PrimeVue centers the popover under its anchor, but it doesn't account for viewport edges. This function manually corrects that.

**What it does:**
1. Reads the popover container's bounding rect and the anchor element's rect.
2. Figures out where the popover *wants* to be horizontally (`targetX` — the click's x-coordinate or the anchor's midpoint).
3. Calculates an `offset` (shift in pixels) so the popover stays inside a 12px gutter on both sides.
4. Applies that offset via `marginLeft`.
5. **Arrow correction:** PrimeVue's arrow is normally centered. After the popover shifts, the arrow would point at the wrong spot, so it sets `--p-popover-arrow-left` on the container to put the arrow back over `targetX`.

---


---

## 2. `alignPopoverAnimated()` — re-run PrimeVue's layout + clamp with slide

Used specifically when the popover flips between above/below because of the resources panel expanding. A sudden jump would be jarring.

1. Reads the current `top` before realigning.
2. Runs `alignOverlay()` + `clampPopoverPosition()`.
3. If `top` changed, it **snaps back** to the old `top`, flushes the DOM (`void el.offsetHeight` forces a reflow), then sets a CSS transition and lets it slide to the new `top`.
4. Removes the transition after it completes so PrimeVue can move the popover freely again.

---

## 3. `onResourceTransitionStart/End()` — anchor-swap trick for flipped popovers

When the popover is **above** the anchor (`.p-popover-flipped`), its position is tracked by `top`. As the resources panel expands, the popover should grow *upward* — but `top`-based positioning means it would instead grow downward and push off-screen.

- **`onResourceTransitionStart`:** Switches from `top`-based to `bottom`-based positioning (pins the bottom edge to where it currently is). This makes the expansion push the box up naturally.
- **`onResourceTransitionEnd`:** Converts back to `top`-based positioning (reads the new top from `getBoundingClientRect`), then calls `alignPopoverAnimated()` to slide into the final correct position.

For non-flipped popovers (below anchor), this is a no-op because the guard `if (!el.classList.contains('p-popover-flipped'))` returns early.

---

## 4. `reposition(event)` — re-anchor to a new trigger element

Used when the popover is already open but the user clicked a *different* row (the trigger moves).

1. Updates `lastAnchorEvent` to the new event.
2. Manually sets `pv.target` and `pv.eventTarget` on the PrimeVue instance so it knows the new anchor.
3. Removes the `.p-popover-flipped` class to reset the flip state.
4. Calls `alignOverlay()` + `clampPopoverPosition()` in `nextTick` to reposition from scratch.

---

## How they connect

```
User opens popover
  └─ onPopoverShow → bindOutsideHandler + clampPopoverPosition (initial placement)

Window resizes
  └─ resizeHandler (debounced 60ms) → alignOverlay + clampPopoverPosition

User clicks different row
  └─ reposition → reset target → alignOverlay + clampPopoverPosition

Resources panel toggled
  └─ Transition @before-enter/leave → onResourceTransitionStart (bottom-pin if flipped)
  └─ Transition @after-enter/leave  → onResourceTransitionEnd (restore top, alignPopoverAnimated)
```

The recurring pattern is always: **PrimeVue's `alignOverlay()` first** (it handles flip/above/below), then **`clampPopoverPosition()` second** (corrects horizontal position and arrow).
