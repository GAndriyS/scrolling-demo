import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ElementRef,
  NgZone,
  OnDestroy,
  TemplateRef,
  ViewChild,
  afterEveryRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

/** Items rendered beyond the visible window on each side. */
const BUFFER = 4;

/** Tolerance (px) below which a re-measured height is not treated as changed. */
const HEIGHT_TOLERANCE = 1;

export type TrackByFn<T> = (index: number, item: T) => unknown;

/** Context passed to each item template. */
export type VsItemContext<T> = {
  $implicit: T;
  index: number;
  focused: boolean;
};

export type ActivatedEvent<T> = { item: T; index: number };

@Component({
  selector: 'app-virtual-scroller',
  imports: [NgTemplateOutlet],
  templateUrl: './virtual-scroller.html',
  styleUrl: './virtual-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualScroller<T> implements AfterViewInit, OnDestroy {
  // ── Inputs ──────────────────────────────────────────────────────────────
  items = input.required<T[]>();
  /** Used as the height for every item until its real height is measured. */
  estimatedItemHeight = input.required<number>();
  /** Optional identity function — enables DOM recycling across scroll. */
  trackByFn = input<TrackByFn<T>>();

  // Sticky-header inputs
  title = input('');
  /** Total item count before any filtering, shown as the denominator. */
  totalCount = input(0);
  /** Extra badge text shown next to the title (e.g. "3 selected"). */
  badgeText = input('');

  // ── Outputs ─────────────────────────────────────────────────────────────
  /** Emitted when the user presses Enter on a focused item. */
  itemActivated = output<ActivatedEvent<T>>();

  // ── View refs ───────────────────────────────────────────────────────────
  @ContentChild(TemplateRef)
  itemTemplate!: TemplateRef<VsItemContext<T>>;

  @ViewChild('viewport', { static: true })
  private viewportRef!: ElementRef<HTMLDivElement>;

  // ── Private state ────────────────────────────────────────────────────────
  private readonly ngZone = inject(NgZone);
  private readonly scrollTopSig = signal(0);
  private readonly viewportHeightSig = signal(0);
  private resizeObserver?: ResizeObserver;

  /**
   * Per-item heights (px). Initialised to estimatedItemHeight; replaced by
   * measured values after each render so positions gradually become exact.
   */
  private readonly rawHeights = signal<number[]>([]);

  // ── Public focusedIndex (writable so parent can reset it) ────────────────
  readonly focusedIndex = signal(-1);

  // ── Derived geometry ────────────────────────────────────────────────────

  /**
   * Prefix-sum offsets array (length = items.length + 1).
   * offsets[i] = top-edge pixel position of item i.
   * offsets[items.length] = totalHeight.
   */
  readonly offsets = computed<Float64Array>(() => {
    const heights = this.rawHeights();
    const est = this.estimatedItemHeight();
    const result = new Float64Array(heights.length + 1);
    for (let i = 0; i < heights.length; i++) {
      result[i + 1] = (result[i] ?? 0) + (heights[i] ?? est);
    }
    return result;
  });

  readonly totalHeight = computed(() => {
    const o = this.offsets();
    return o[o.length - 1] ?? 0;
  });

  readonly startIndex = computed(() => {
    const idx = this.bisect(this.scrollTopSig());
    return Math.max(0, idx - BUFFER);
  });

  readonly endIndex = computed(() => {
    const idx = this.bisect(this.scrollTopSig() + this.viewportHeightSig());
    return Math.min(this.items().length, idx + BUFFER + 1);
  });

  readonly visibleItems = computed(() =>
    this.items().slice(this.startIndex(), this.endIndex()),
  );

  /** translateY value that aligns rendered items with their scroll position. */
  readonly offsetY = computed(() => this.offsets()[this.startIndex()] ?? 0);

  readonly showingText = computed(() => {
    const total = this.totalCount();
    const count = this.items().length;
    const label = this.title();
    if (total > 0 && count !== total) {
      return `Showing ${count.toLocaleString()} of ${total.toLocaleString()} ${label}`;
    }
    return `${count.toLocaleString()} ${label}`;
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────

  constructor() {
    // Re-initialise height cache whenever the items array or estimate changes.
    // Also clamp scrollTop so the viewport never shows a white gap when the
    // list shrinks after filtering.
    effect(
      () => {
        const count = this.items().length;
        const est = this.estimatedItemHeight();
        this.rawHeights.set(new Array<number>(count).fill(est));
        const newTotal = count * est;
        if (this.scrollTopSig() > newTotal) {
          this.scrollTopSig.set(0);
          // Also reset the DOM scroll position so onScroll() stays in sync.
          const el = this.viewportRef?.nativeElement;
          if (el) el.scrollTop = 0;
        }
      },
      { allowSignalWrites: true },
    );

    // Reset keyboard focus only when the list type switches (estimatedItemHeight
    // changes) — not on every filter/sort, which would discard the user's focus.
    effect(
      () => {
        this.estimatedItemHeight(); // track signal
        this.focusedIndex.set(-1);
      },
      { allowSignalWrites: true },
    );

    // After every render pass, measure newly visible items and update heights.
    afterEveryRender({ read: () => this.measureItems() });
  }

  ngAfterViewInit(): void {
    const el = this.viewportRef.nativeElement;
    this.viewportHeightSig.set(el.clientHeight);

    this.resizeObserver = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height ?? 0;
      // ResizeObserver runs outside Angular's zone.
      this.ngZone.run(() => this.viewportHeightSig.set(h));
    });
    this.resizeObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // ── Event handlers ──────────────────────────────────────────────────────

  onScroll(): void {
    this.scrollTopSig.set(this.viewportRef.nativeElement.scrollTop);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.items();
    if (!items.length) return;

    let idx = this.focusedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        idx = idx < items.length - 1 ? idx + 1 : idx;
        if (idx < 0) idx = 0;
        break;

      case 'ArrowUp':
        event.preventDefault();
        idx = idx > 0 ? idx - 1 : 0;
        break;

      case 'Enter': {
        if (idx < 0) return;
        const item = items[idx];
        if (item !== undefined) {
          this.itemActivated.emit({ item, index: idx });
        }
        return;
      }

      default:
        return;
    }

    this.focusedIndex.set(idx);
    this.scrollIndexIntoView(idx);
  }

  /** Used by @for track expression. Falls back to item reference identity. */
  trackItem(index: number, item: T): unknown {
    const fn = this.trackByFn();
    return fn ? fn(index, item) : item;
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /**
   * Binary search: returns the largest index i such that offsets[i] <= target.
   * This gives the item whose top edge is at or before `target`.
   */
  private bisect(target: number): number {
    const offsets = this.offsets();
    let lo = 0;
    let hi = offsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((offsets[mid] ?? 0) <= target) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  /**
   * Reads the rendered wrapper heights and patches rawHeights when they differ.
   * Called in afterRender { read } phase to avoid triggering layout thrash.
   */
  private measureItems(): void {
    const viewport = this.viewportRef?.nativeElement;
    if (!viewport) return;

    const wrappers =
      viewport.querySelectorAll<HTMLElement>('[data-vs-index]');
    if (!wrappers.length) return;

    const current = this.rawHeights();
    const updated = current.slice(); // shallow copy
    let changed = false;

    wrappers.forEach(wrapper => {
      const raw = wrapper.dataset['vsIndex'];
      if (raw === undefined) return;
      const idx = Number(raw);
      const measured = wrapper.offsetHeight;
      if (measured > 0 && Math.abs((updated[idx] ?? 0) - measured) > HEIGHT_TOLERANCE) {
        updated[idx] = measured;
        changed = true;
      }
    });

    if (changed) {
      this.rawHeights.set(updated);
    }
  }

  /** Scrolls the viewport so that item at `idx` is fully visible. */
  private scrollIndexIntoView(idx: number): void {
    const viewport = this.viewportRef.nativeElement;
    const offsets = this.offsets();
    const heights = this.rawHeights();
    const top = offsets[idx] ?? 0;
    const height = heights[idx] ?? this.estimatedItemHeight();
    const bottom = top + height;
    const st = viewport.scrollTop;
    const vh = viewport.clientHeight;

    if (top < st) {
      viewport.scrollTop = top;
    } else if (bottom > st + vh) {
      viewport.scrollTop = bottom - vh;
    }
  }
}
