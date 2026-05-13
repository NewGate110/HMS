import { Injectable, signal } from '@angular/core';
import type { UserRole } from '../constants/roles';

export interface MockAdminUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  active: boolean;
  lastActivity: string;
}

@Injectable({ providedIn: 'root' })
export class MockAdminDataService {
  readonly users = signal<MockAdminUser[]>([
    {
      id: 101,
      email: 'ops@grandplaza.com',
      fullName: 'Olivia Porter',
      role: 'FrontDeskStaff',
      active: true,
      lastActivity: new Date().toISOString(),
    },
    {
      id: 102,
      email: 'finance@grandplaza.com',
      fullName: 'Felix Chen',
      role: 'HotelManager',
      active: true,
      lastActivity: new Date().toISOString(),
    },
  ]);

  upsert(user: MockAdminUser): void {
    this.users.update((list) => {
      const i = list.findIndex((u) => u.id === user.id);
      if (i === -1) return [...list, user];
      const next = [...list];
      next[i] = user;
      return next;
    });
  }

  remove(id: number): void {
    this.users.update((list) => list.filter((u) => u.id !== id));
  }
}
