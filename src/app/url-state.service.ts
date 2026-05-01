import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

export type SortOrder = 'recent' | 'title';

export type UrlState = {
  postBodySearch: string;
  users: Set<number>;
  sort: SortOrder;
};

const VALID_SORTS = new Set<SortOrder>(['recent', 'title']);

function isSortOrder(v: string): v is SortOrder {
  return VALID_SORTS.has(v as SortOrder);
}

/**
 * Thin service responsible only for reading from / writing to the URL.
 * All state logic lives in AppStore.
 */
@Injectable({ providedIn: 'root' })
export class UrlStateService {
  private readonly router = inject(Router);

  /** Parse the current URL query string into a plain state snapshot. */
  read(): UrlState {
    const params = new URLSearchParams(window.location.search);

    const postBodySearch = params.get('pq') ?? '';

    const usersRaw = params.get('users') ?? '';
    const users = new Set<number>(
      usersRaw
        .split(',')
        .map(s => parseInt(s, 10))
        .filter(n => Number.isFinite(n) && n > 0),
    );

    const sortRaw = params.get('sort') ?? '';
    const sort: SortOrder = isSortOrder(sortRaw) ? sortRaw : 'recent';

    return { postBodySearch, users, sort };
  }

  /** Overwrite the current history entry — never creates a back-stack entry. */
  write(state: UrlState): void {
    const params: Record<string, string> = {};

    if (state.postBodySearch) params['pq'] = state.postBodySearch;
    if (state.users.size > 0) {
      params['users'] = [...state.users].sort((a, b) => a - b).join(',');
    }
    // Omit default so clean URLs stay clean.
    if (state.sort !== 'recent') params['sort'] = state.sort;

    void this.router.navigate([], {
      queryParams: params,
      replaceUrl: true,
      queryParamsHandling: 'replace',
    });
  }
}
