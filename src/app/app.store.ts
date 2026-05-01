import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { UrlStateService } from './url-state.service';
import type { SortOrder } from './url-state.service';

export type { SortOrder };

/**
 * Application-level signal store.
 *
 * Single source of truth for all shared UI state. No NgRx — just Angular
 * signals + computed. The store initialises from URL params on first
 * injection and keeps the URL in sync via an effect.
 */
@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly urlService = inject(UrlStateService);
  private readonly _initial = this.urlService.read();

  // ── Writable state ─────────────────────────────────────────────────────

  /** IDs of the currently selected users. */
  readonly usersSelected = signal<Set<number>>(this._initial.users);

  /**
   * Dedicated post-column search (title + body).
   * Written via a debounced input; read by the posts filter in App.
   */
  readonly postBodySearch = signal<string>(this._initial.postBodySearch);

  /** Post sort order. */
  readonly sort = signal<SortOrder>(this._initial.sort);

  // ── Derived / computed ─────────────────────────────────────────────────

  /** True when at least one user is selected. */
  readonly hasSelection = computed(() => this.usersSelected().size > 0);

  /** Human-readable badge, e.g. "3 selected". */
  readonly selectionBadge = computed(() => {
    const n = this.usersSelected().size;
    return n > 0 ? `${n} selected` : '';
  });

  constructor() {
    // Mirror every state change to the URL (replaceState — no history entry).
    effect(() => {
      this.urlService.write({
        postBodySearch: this.postBodySearch(),
        users: this.usersSelected(),
        sort: this.sort(),
      });
    });
  }

  // ── Actions ────────────────────────────────────────────────────────────

  /** Toggle a single user's selection. */
  toggleUser(id: number): void {
    const next = new Set(this.usersSelected());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.usersSelected.set(next);
  }

  /** Replace the entire selection set (e.g. when restored from URL). */
  setUsersSelected(ids: Set<number>): void {
    this.usersSelected.set(new Set(ids));
  }

  /** Called by the debounced post-column search after the delay. */
  setPostBodySearch(q: string): void {
    this.postBodySearch.set(q);
  }

  setSort(s: SortOrder): void {
    this.sort.set(s);
  }

  clearSelection(): void {
    this.usersSelected.set(new Set());
  }
}
