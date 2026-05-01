import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, linkedSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of, switchMap, debounceTime, distinctUntilChanged } from 'rxjs';
import type { Post } from '../app.models';
import { PostDialog } from '../post-dialog/post-dialog';
import { generateComments } from '../data/mock-data';
// eslint-disable-next-line @angular-eslint/no-unused-imports -- generic component; selector used in template
import { VirtualScroller } from '../virtual-scroller/virtual-scroller';
import type { TrackByFn, ActivatedEvent } from '../virtual-scroller/virtual-scroller';
import { AppStore } from '../app.store';
import type { SortOrder } from '../app.store';

@Component({
  selector: 'app-posts',
  imports: [MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, VirtualScroller],
  templateUrl: './posts.html',
  styleUrl: './posts.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Posts {
  posts = input.required<Post[]>();
  totalCount = input(0);

  readonly trackPost: TrackByFn<Post> = (_i, post) => post.id;

  private readonly dialog = inject(MatDialog);
  private readonly store = inject(AppStore);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Mirrors the store signal so the input always reflects the current value,
   * including URL-restored state and programmatic resets — a linkedSignal
   * re-derives whenever the source changes but is also locally writable.
   */
  readonly searchValue = linkedSignal(() => this.store.postBodySearch());

  /** Mirrors the store sort signal; locally writable for immediate UI feedback. */
  readonly sortValue = linkedSignal<SortOrder>(() => this.store.sort());

  /**
   * Raw keystrokes flow into this subject.
   * switchMap cancels any in-flight (async) search when a new keystroke arrives.
   * debounceTime(200) prevents firing until the user pauses typing.
   * distinctUntilChanged avoids redundant store writes.
   */
  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(q => of(q)), // cancels stale; swap `of(q)` for an API call in real apps
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(q => this.store.setPostBodySearch(q));
  }

  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  onSortChange(value: SortOrder): void {
    this.store.setSort(value);
  }

  openPost(post: Post): void {
    this.dialog.open(PostDialog, {
      width: '560px',
      maxHeight: '80vh',
      data: { post, comments: generateComments(post.id) },
    });
  }

  onItemActivated(event: ActivatedEvent<Post>): void {
    this.openPost(event.item);
  }
}
