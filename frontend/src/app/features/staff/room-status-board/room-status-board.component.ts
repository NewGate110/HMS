import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';
import type { RoomDto } from '../../../core/models/room.models';
import { ROOM_STATUSES, type RoomStatus } from '../../../core/constants/room-status';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-room-status-board',
  standalone: true,
  imports: [MatSelectModule, AppCardComponent, AppLoaderComponent, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold text-zinc-900">Room status</h1>
        <app-button variant="secondary" type="button" (clicked)="reload()">Refresh</app-button>
      </div>
      @if (loading()) {
        <app-loader caption="Loading rooms…" />
      } @else {
        <div class="grid gap-4 lg:grid-cols-3 xl:grid-cols-6">
          @for (st of ROOM_STATUSES; track st) {
            <app-card [title]="st">
              <div class="mt-3 space-y-2">
                @for (r of roomRows(st); track r.id) {
                  <div
                    class="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50 px-2 py-2 text-xs"
                  >
                    <span class="font-medium">{{ r.roomNumber }}</span>
                    <select
                      class="rounded border border-zinc-200 bg-white px-1 py-0.5 text-xs text-zinc-700"
                      [value]="r.status"
                      [disabled]="updating()[r.id]"
                      (change)="changeStatus(r, $any($event.target).value)"
                    >
                      @for (s of ROOM_STATUSES; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                  </div>
                }
              </div>
            </app-card>
          }
        </div>
      }
    </div>
  `,
})
export class RoomStatusBoardComponent {
  private readonly hotelsApi = inject(HotelsApiService);
  private readonly notify = inject(NotificationService);

  readonly ROOM_STATUSES = ROOM_STATUSES;
  readonly rooms = signal<RoomDto[]>([]);
  readonly loading = signal(true);
  readonly updating = signal<Record<number, boolean>>({});

  readonly byStatus = computed(() => {
    const map = new Map<RoomStatus, RoomDto[]>();
    for (const s of ROOM_STATUSES) map.set(s, []);
    for (const r of this.rooms()) {
      const key = (r.status as RoomStatus) ?? 'Available';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  });

  roomRows(st: RoomStatus): RoomDto[] {
    return this.byStatus().get(st) ?? [];
  }

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.hotelsApi.getRooms(environment.defaultHotelId).subscribe({
      next: (r) => {
        this.rooms.set(r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeStatus(room: RoomDto, newStatus: RoomStatus): void {
    if (room.status === newStatus) return;
    this.updating.update((u) => ({ ...u, [room.id]: true }));
    this.hotelsApi.updateRoomStatus(environment.defaultHotelId, room.id, newStatus).subscribe({
      next: (updated) => {
        this.rooms.update((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
        this.updating.update((u) => ({ ...u, [room.id]: false }));
      },
      error: () => {
        this.updating.update((u) => ({ ...u, [room.id]: false }));
        this.notify.error('Failed to update room status.');
      },
    });
  }
}
