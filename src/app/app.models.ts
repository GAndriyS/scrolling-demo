export type User = {
  id: number;
  name: string;
  email: string;
};

export type Post = {
  id: number;
  userId: number;
  title: string;
  author: string;
  body: string;
};

export type Comment = {
  id: number;
  author: string;
  body: string;
};
