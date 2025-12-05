import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Theater } from '../../../../core/services/theater.service';
import { ScreenListItem } from '../venue-management.component';

@Component({
  selector: 'app-theatre-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theatre-item.component.html',
  styleUrls: ['./theatre-item.component.css']

})
export class TheatreItemComponent {
  @Input({ required: true }) theatre!: Theater;
  @Input() expanded = false;
  @Input() screens: ScreenListItem[] = [];

  @Output() edit = new EventEmitter<Theater>();
  @Output() toggleStatus = new EventEmitter<{id: string, currentStatus: boolean}>();
  @Output() delete = new EventEmitter<string>();
  @Output() toggleScreens = new EventEmitter<string>();
  @Output() configureScreen = new EventEmitter<{theatreId: string, screenId: string}>();
  @Output() previewScreen = new EventEmitter<{theatreId: string, screenId: string}>();

  statusUpdating = signal(false);
  deleting = signal(false);
}