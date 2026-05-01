import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { User, Post } from './app.models';
import { Header } from './header/header';
import { Users } from './users/users';
import { Posts } from './posts/posts';
import { generateUsers, generatePosts } from './data/mock-data';
import { AppStore } from './app.store';

@Component({
  selector: 'app-root',
  imports: [Header, Users, Posts],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly store = inject(AppStore);

  // ── Raw data (generated once, never mutated) ────────────────────────────
  readonly users: User[] = generateUsers(1000);
  readonly posts: Post[] = generatePosts(10000, this.users);
  readonly totalUserCount = this.users.length;
  readonly totalPostCount = this.posts.length;

  // ── Derived lists (computed so Angular tracks signal reads) ─────────────

  readonly filteredUsers = computed<User[]>(() => this.users);

  readonly filteredPosts = computed<Post[]>(() => {
    const bodyQ = this.store.postBodySearch().toLowerCase();
    const selected = this.store.usersSelected();
    const sortOrder = this.store.sort();

    const filtered = this.posts.filter(p => {
      const matchesBody =
        !bodyQ ||
        p.title.toLowerCase().includes(bodyQ) ||
        p.body.toLowerCase().includes(bodyQ);
      const matchesUser = selected.size === 0 || selected.has(p.userId);
      return matchesBody && matchesUser;
    });

    if (sortOrder === 'title') {
      return filtered.slice().sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'recent': highest ID first
    return filtered.slice().reverse();
  });
}
