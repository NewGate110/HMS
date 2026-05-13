import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex size-9 items-center justify-center rounded-full text-xs font-semibold uppercase text-white"
      [class]="toneClass()"
      [attr.aria-label]="'Avatar for ' + name()"
    >
      {{ initials() }}
    </span>
  `,
})
export class AppAvatarComponent {
  name = input.required<string>();
  toneClass = input('bg-gradient-to-br from-zinc-700 to-zinc-900');

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '?';
    const b = parts.length > 1 ? parts[parts.length - 1]![0] : parts[0]?.[1];
    return (a + (b ?? '')).toUpperCase();
  });
}
