import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { User } from '../app.models';
import { VirtualScroller } from '../virtual-scroller/virtual-scroller';
import type { TrackByFn, ActivatedEvent } from '../virtual-scroller/virtual-scroller';
import { AppStore } from '../app.store';

@Component({
  selector: 'app-users',
  imports: [MatIconModule, VirtualScroller],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  users = input.required<User[]>();
  selectedIds = input<Set<number>>(new Set());
  totalCount = input(0);

  private readonly store = inject(AppStore);

  /** Stable identity for Angular's @for recycling. */
  readonly trackUser: TrackByFn<User> = (_i, user) => user.id;

  get badgeText(): string {
    const n = this.selectedIds().size;
    return n > 0 ? `${n} selected` : '';
  }

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: number): void {
    this.store.toggleUser(id);
  }

  onItemActivated(event: ActivatedEvent<User>): void {
    this.store.toggleUser(event.item.id);
  }
}
