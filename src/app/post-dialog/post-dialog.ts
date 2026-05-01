import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import type { Post, Comment } from '../app.models';

export type PostDialogData = {
  post: Post;
  comments: Comment[];
};

@Component({
  selector: 'app-post-dialog',
  imports: [MatDialogModule, MatDividerModule, MatIconModule, MatButtonModule],
  templateUrl: './post-dialog.html',
  styleUrl: './post-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostDialog {
  data = inject<PostDialogData>(MAT_DIALOG_DATA);
}
