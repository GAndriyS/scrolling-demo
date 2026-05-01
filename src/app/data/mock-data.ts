import type { User, Post, Comment } from '../app.models';

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Isla', 'James',
  'Karen', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xander', 'Yara', 'Zoe', 'Aaron', 'Bella', 'Carlos', 'Diana',
  'Ethan', 'Fiona', 'George', 'Hannah', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nina',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson',
  'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Young',
  'Robinson', 'Lewis', 'Walker', 'Hall', 'Allen', 'King', 'Wright', 'Scott', 'Green', 'Baker',
  'Adams', 'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Phillips',
];

const POST_TITLE_PARTS = {
  adjectives: ['Ultimate', 'Complete', 'Practical', 'Essential', 'Modern', 'Advanced', 'Simple', 'Effective', 'Quick', 'Deep'],
  subjects: ['Guide to', 'Introduction to', 'Tips for', 'Overview of', 'Patterns in', 'Best Practices for', 'Secrets of', 'Handbook for'],
  topics: [
    'Angular', 'TypeScript', 'RxJS', 'CSS Grid', 'Flexbox', 'Node.js', 'REST APIs', 'GraphQL',
    'Unit Testing', 'Performance', 'Accessibility', 'State Management', 'Animations', 'Lazy Loading',
    'Change Detection', 'Dependency Injection', 'HTTP Client', 'Forms', 'Routing', 'Signals',
    'Web Components', 'PWA', 'Server-Side Rendering', 'Docker', 'CI/CD', 'Monorepos', 'Microfrontends',
  ],
};

/**
 * Mix of short (1-2 lines) and long (3-4 lines) bodies so the virtual scroller
 * actually exercises variable-height measurement.
 */
const POST_BODIES = [
  // ── Short (1-2 lines) ──────────────────────────────────────────────────
  'A concise reference that cuts through the noise and focuses on what actually matters in practice.',
  'Quick tip: always profile before optimising — intuition is wrong more often than you think.',
  'TL;DR — use the right tool for the job and document why you chose it.',
  'Three rules: keep it simple, make it correct, then make it fast.',

  // ── Medium (2-3 lines) ─────────────────────────────────────────────────
  'This overview highlights the key concepts and links to deeper resources for each topic covered. '
  + 'Whether you are just starting out or refreshing your knowledge, there is something here for every skill level.',
  'We benchmark several approaches and explain the trade-offs so you can make an informed decision. '
  + 'Performance numbers were collected on real-world datasets, not synthetic microbenchmarks.',
  'Understanding this topic will level up your architecture skills and make your team more productive. '
  + 'We have seen teams cut their release cycles in half after internalising these patterns.',
  'Packed with code snippets, diagrams, and actionable tips you can start using today. '
  + 'Each example has been tested against the latest stable release of the library.',

  // ── Long (3-4 lines) ──────────────────────────────────────────────────
  'This article dives deep into the fundamentals and explores advanced patterns you can apply immediately '
  + 'in production. We start from first principles, build intuition through worked examples, and finish '
  + 'with a checklist you can pin to your team wiki.',
  'We cover everything from initial setup to deploying a fully optimised solution with best practices '
  + 'built in from day one. Along the way we tackle authentication, error boundaries, observability, '
  + 'and zero-downtime deployments — the full picture, not just the happy path.',
  'Learn how to structure your code for maximum maintainability and testability as your project scales '
  + 'from a single developer to a team of twenty. We examine folder conventions, module boundaries, '
  + 'dependency rules, and the warning signs that tell you a refactor is overdue.',
  'Discover the pitfalls most developers encounter and how to elegantly work around them. This post '
  + 'is based on post-mortems from five real production incidents, anonymised with permission. Each '
  + 'section ends with a concrete guard-rail you can add to your CI pipeline today.',
  'A step-by-step walkthrough with real-world examples drawn from large enterprise applications. '
  + 'We trace a feature request all the way from product spec through design, implementation, code '
  + 'review, staging, and finally a canary release — so you see exactly where the friction lives '
  + 'and how senior engineers eliminate it.',
];

function pick<T>(arr: readonly T[], seed: number): T {
  // Modulo guarantees index is within bounds; non-null assertion is safe.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return arr[seed % arr.length]!;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function generateUsers(count: number = 1000): User[] {
  const users: User[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES, i * 7 + 3);
    const lastName = pick(LAST_NAMES, i * 13 + 5);
    const name = `${firstName} ${lastName}`;

    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    if (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    }
    usedEmails.add(email);

    users.push({ id: i + 1, name, email });
  }

  return users;
}

export function generatePosts(count: number = 10000, users: User[]): Post[] {
  const posts: Post[] = [];

  for (let i = 0; i < count; i++) {
    const adj = pick(POST_TITLE_PARTS.adjectives, i * 3 + 1);
    const subj = pick(POST_TITLE_PARTS.subjects, i * 7 + 2);
    const topic = pick(POST_TITLE_PARTS.topics, i * 11 + 4);
    const title = `${adj} ${subj} ${topic}`;

    const author = pick(users, Math.floor(seededRandom(i) * users.length));
    const body = pick(POST_BODIES, i * 17 + 6);

    posts.push({ id: i + 1, userId: author.id, title, author: author.name, body });
  }

  return posts;
}

const COMMENT_BODIES = [
  'Great post! Really helped me understand this topic better.',
  'I disagree with some points here, but overall a solid write-up.',
  'This is exactly what I was looking for. Thanks for sharing!',
  'Have you considered the performance implications of this approach?',
  'I tried this in my project and it worked perfectly.',
  'Could you elaborate a bit more on the third point?',
  'Bookmarked. Will come back to this when I start my next project.',
  'The examples are really clear and easy to follow.',
  'I ran into this issue last week — wish I had found this article sooner.',
  'Minor typo in the second paragraph, but great content otherwise.',
  'This contradicts what I read elsewhere. Do you have sources?',
  'Shared this with my team. Very useful!',
  'The diagrams would make this even clearer.',
  'Short and to the point. Exactly what I needed.',
  'Looking forward to a follow-up post on this subject.',
];

export function generateComments(postId: number): Comment[] {
  const count = 2 + (Math.abs(Math.floor(Math.sin(postId * 7919) * 1000)) % 14);
  const comments: Comment[] = [];

  for (let i = 0; i < count; i++) {
    const seed = postId * 100 + i;
    const firstName = pick(FIRST_NAMES, seed);
    const lastName = pick(LAST_NAMES, seed * 3 + 7);
    comments.push({
      id: i + 1,
      author: `${firstName} ${lastName}`,
      body: pick(COMMENT_BODIES, seed * 17 + 5),
    });
  }

  return comments;
}
