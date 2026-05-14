import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormatTypePipe } from '../../shared/pipes/format-type.pipe';
import { HotelsApiService } from '../../core/services/hotels-api.service';
import { RoomsApiService } from '../../core/services/rooms-api.service';
import type { RoomSearchResultItem } from '../../core/models/room.models';

interface Faq {
  q: string;
  a: string;
}
interface Review {
  name: string;
  role: string;
  text: string;
  initials: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, FormatTypePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ─── HERO ─── -->
    <section
      class="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden pb-16 md:pb-24"
    >
      <img
        src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2000&q=80"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/92 via-zinc-900/45 to-zinc-800/10"
        aria-hidden="true"
      ></div>

      <div class="relative z-10 mx-auto w-full max-w-6xl px-6">
        <p class="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-400">Grand Plaza</p>
        <h1
          class="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white leading-[1.07] md:text-6xl"
        >
          Begin your dream stay<br />with paradise at your feet
        </h1>
        <p class="mt-5 max-w-lg text-[15px] leading-7 text-white/70">
          Private island luxury, pristine coral reefs, and award-winning hospitality in the heart of
          the Indian Ocean.
        </p>

        <!-- Search form -->
        <div
          class="mt-8 grid grid-cols-1 rounded-2xl bg-white p-2 shadow-2xl md:grid-cols-[1fr_1px_1fr_1px_1fr_1px_auto_auto]"
        >
          <!-- Location -->
          <div class="flex items-center gap-3 px-4 py-3">
            <span class="material-icons-outlined shrink-0 text-zinc-400 text-xl" aria-hidden="true"
              >location_on</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Destination
              </p>
              <select
                #locationRef
                class="mt-0.5 w-full bg-transparent text-sm font-semibold text-zinc-800 outline-none appearance-none cursor-pointer"
              >
                <option value="" class="font-normal text-zinc-400">Any destination</option>
                @for (hotel of destinations(); track hotel.id) {
                  <option [value]="hotel.city">{{ hotel.city }}</option>
                }
              </select>
            </div>
          </div>
          <div class="hidden bg-zinc-100 md:block"></div>
          <!-- Check-in -->
          <div class="flex items-center gap-3 px-4 py-3">
            <span class="material-icons-outlined shrink-0 text-zinc-400 text-xl"
              >calendar_today</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Check-in <span class="text-red-400 text-xs align-top ml-0.5">*</span>
              </p>
              <input
                #checkInRef
                type="date"
                required
                [valueAsDate]="defaultCheckIn"
                [min]="todayDateString"
                class="mt-0.5 w-full cursor-pointer bg-transparent text-sm font-semibold text-zinc-800 outline-none"
              />
            </div>
          </div>
          <div class="hidden bg-zinc-100 md:block"></div>
          <!-- Check-out -->
          <div class="flex items-center gap-3 px-4 py-3">
            <span class="material-icons-outlined shrink-0 text-zinc-400 text-xl"
              >calendar_today</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Check-out <span class="text-red-400 text-xs align-top ml-0.5">*</span>
              </p>
              <input
                #checkOutRef
                type="date"
                required
                [valueAsDate]="defaultCheckOut"
                [min]="defaultCheckInDateString"
                class="mt-0.5 w-full cursor-pointer bg-transparent text-sm font-semibold text-zinc-800 outline-none"
              />
            </div>
          </div>
          <div class="hidden bg-zinc-100 md:block"></div>
          <!-- Guests -->
          <div class="flex items-center gap-3 px-4 py-3">
            <span class="material-icons-outlined shrink-0 text-zinc-400 text-xl" aria-hidden="true"
              >group</span
            >
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Guests</p>
              <input
                #guestsRef
                type="number"
                min="1"
                max="12"
                placeholder="2"
                class="mt-0.5 w-full cursor-pointer bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder:font-normal placeholder:text-zinc-400"
              />
            </div>
          </div>
          <!-- Search button -->
          <button
            type="button"
            (click)="
              search(locationRef.value, checkInRef.value, checkOutRef.value, guestsRef.value)
            "
            [disabled]="loading()"
            class="flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-600 active:scale-[0.98] disabled:opacity-60 mt-1 md:mt-0"
          >
            <span class="material-icons-outlined text-lg" aria-hidden="true">search</span>
            Search
          </button>
        </div>

        @if (dateError()) {
          <div class="mt-4 rounded-lg bg-red-500/90 p-3 text-sm text-white backdrop-blur-sm">
            {{ dateError() }}
          </div>
        }

        @if (!searched()) {
          <p class="mt-8 flex items-center gap-1.5 text-xs text-white/30">
            <span class="material-icons-outlined text-base" aria-hidden="true">south</span>
            Scroll to explore
          </p>
        }
      </div>
    </section>

    <!-- ─── SEARCH RESULTS ─── -->
    @if (searched()) {
      <section id="search-results" class="bg-zinc-50 py-16 px-6">
        <div class="mx-auto max-w-6xl">
          @if (loading()) {
            <!-- Skeleton -->
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              @for (s of [1, 2, 3, 4, 5, 6]; track s) {
                <div class="animate-pulse rounded-2xl bg-white border border-zinc-100 p-5">
                  <div class="h-4 w-3/4 rounded bg-zinc-200 mb-3"></div>
                  <div class="h-3 w-1/2 rounded bg-zinc-100 mb-6"></div>
                  <div class="h-10 w-full rounded bg-zinc-100 mb-3"></div>
                  <div class="h-3 w-2/3 rounded bg-zinc-100"></div>
                </div>
              }
            </div>
          } @else if (results().length === 0) {
            <!-- Empty state -->
            <div class="flex flex-col items-center justify-center py-20 text-center">
              <span class="material-icons-outlined text-5xl text-zinc-300" aria-hidden="true"
                >search_off</span
              >
              <p class="mt-5 text-xl font-semibold text-zinc-700">No rooms found</p>
              <p class="mt-2 text-[14px] text-zinc-400">
                Try a different destination, adjust your dates, or lower the guest count.
              </p>
            </div>
          } @else {
            <!-- Results header -->
            <div class="mb-8 flex items-baseline justify-between">
              <div>
                <h2 class="text-2xl font-bold tracking-tight text-zinc-900">Available rooms</h2>
                <p class="mt-1 text-[13px] text-zinc-400">
                  {{ results().length }} room{{ results().length === 1 ? '' : 's' }} found
                </p>
              </div>
              <a
                routerLink="/rooms/search"
                class="shrink-0 rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Advanced search
              </a>
            </div>
            <!-- Cards grid -->
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              @for (room of results(); track room.roomId) {
                <div
                  class="group flex flex-col rounded-2xl bg-white border border-zinc-100 overflow-hidden shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.1)]"
                >
                  <!-- Type badge + price -->
                  <div class="flex items-start justify-between p-5 pb-3">
                    <div>
                      <span
                        class="inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-700"
                      >
                        {{ room.type | formatType }}
                      </span>
                      <p class="mt-2 text-sm font-medium text-zinc-500">
                        {{ room.hotelName }}
                      </p>
                      <p class="text-[12px] text-zinc-400">{{ room.city }}, {{ room.country }}</p>
                    </div>
                    <div class="text-right shrink-0 ml-3">
                      <p class="text-xl font-bold text-zinc-900">&#36;{{ room.pricePerNight }}</p>
                      <p class="text-[11px] text-zinc-400">/ night</p>
                    </div>
                  </div>
                  <!-- Description -->
                  <p class="px-5 text-[13px] leading-5 text-zinc-500 line-clamp-2 flex-1">
                    {{ room.description }}
                  </p>
                  <!-- Footer -->
                  <div
                    class="flex items-center justify-between px-5 py-4 mt-3 border-t border-zinc-50"
                  >
                    <div class="flex items-center gap-3 text-[12px] text-zinc-400">
                      <span class="flex items-center gap-1">
                        <span class="material-icons-outlined text-base text-zinc-300">person</span>
                        {{ room.capacity }} guest{{ room.capacity === 1 ? '' : 's' }}
                      </span>
                      <span class="flex items-center gap-1">
                        <span class="material-icons-outlined text-base text-zinc-300">layers</span>
                        Floor {{ room.floorNumber }}
                      </span>
                    </div>
                    <a
                      [routerLink]="['/rooms', room.roomId]"
                      [queryParams]="lastSearch()"
                      class="rounded-full bg-zinc-900 px-4 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-zinc-700"
                    >
                      View details
                    </a>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>
    }

    <!-- ─── ABOUT ─── -->
    <section class="bg-white py-24 px-6">
      <div class="mx-auto max-w-6xl grid grid-cols-1 gap-16 md:grid-cols-2 items-center">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.32em] text-cyan-500">#About Us</p>
          <h2
            class="mt-4 text-3xl font-bold tracking-tight text-zinc-900 leading-tight md:text-[2.5rem]"
          >
            A passionate team dedicated to making your stay unforgettable
          </h2>
          <p class="mt-5 text-[15px] leading-7 text-zinc-500">
            Grand Plaza is a five-star private island retreat nestled in the North Malé Atoll. Our
            mission is to deliver personalised hospitality that transforms every moment into a
            lasting memory.
          </p>
          <p class="mt-3 text-[15px] leading-7 text-zinc-500">
            From sunrise yoga on your overwater deck to candlelit dinners above the lagoon — every
            detail at Grand Plaza is crafted with intention.
          </p>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-2xl bg-zinc-50 p-6 text-center">
            <p class="text-4xl font-bold text-zinc-900">512<span class="text-cyan-500">+</span></p>
            <p class="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Happy Guests
            </p>
          </div>
          <div class="rounded-2xl bg-zinc-50 p-6 text-center">
            <p class="text-4xl font-bold text-zinc-900">52</p>
            <p class="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Luxury Villas
            </p>
          </div>
          <div class="rounded-2xl bg-zinc-50 p-6 text-center">
            <p class="text-4xl font-bold text-zinc-900">4.9<span class="text-cyan-500">★</span></p>
            <p class="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Guest Rating
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── ROOMS ─── -->
    <section class="bg-zinc-50 py-24 px-6">
      <div class="mx-auto max-w-6xl">
        <p class="text-xs font-bold uppercase tracking-[0.32em] text-cyan-500">#Our Rooms</p>
        <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h2
            class="max-w-xl text-3xl font-bold tracking-tight text-zinc-900 leading-tight md:text-[2.5rem]"
          >
            Explore our exclusive collection of rooms & villas
          </h2>
          <a
            routerLink="/rooms/search"
            class="shrink-0 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
            >View all rooms</a
          >
        </div>
        <p class="mt-3 max-w-xl text-[15px] leading-7 text-zinc-500">
          Each villa is a sanctuary designed for pure indulgence — where the Indian Ocean becomes
          your living room.
        </p>

        <!-- Asymmetric grid: large left spans 2 rows, 2 stacked right -->
        <div
          class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2"
          style="grid-template-rows: auto auto;"
        >
          <a
            routerLink="/rooms/search"
            class="group relative block overflow-hidden rounded-2xl md:row-span-2"
            style="min-height: 460px;"
          >
            <img
              src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80"
              alt="Overwater Bungalow"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-zinc-950/82 via-zinc-950/10 to-transparent"
            ></div>
            <div class="absolute bottom-0 left-0 p-7">
              <p class="text-[11px] font-semibold uppercase tracking-widest text-white/55">
                Most Popular
              </p>
              <p class="mt-1 text-2xl font-bold text-white">Overwater Bungalow</p>
              <p class="mt-1.5 text-[13px] text-white/60">
                Direct lagoon access · Private sun deck · Glass floor
              </p>
              <span
                class="mt-4 inline-block text-[13px] font-semibold text-cyan-300 underline underline-offset-2 transition-colors group-hover:text-cyan-200"
              >
                Explore rooms →
              </span>
            </div>
          </a>

          <a
            routerLink="/rooms/search"
            class="group relative block h-52 overflow-hidden rounded-2xl md:h-auto"
          >
            <img
              src="https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=80"
              alt="Beach Villa"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/75 to-transparent"></div>
            <div class="absolute bottom-0 left-0 p-5">
              <p class="font-bold text-white text-lg">Beach Villa</p>
              <p class="mt-1 text-[13px] text-white/60">Private beach access · Ocean breeze</p>
            </div>
          </a>

          <a
            routerLink="/rooms/search"
            class="group relative block h-52 overflow-hidden rounded-2xl md:h-auto"
          >
            <img
              src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=900&q=80"
              alt="Ocean Suite"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/75 to-transparent"></div>
            <div class="absolute bottom-0 left-0 p-5">
              <p class="font-bold text-white text-lg">Ocean Suite</p>
              <p class="mt-1 text-[13px] text-white/60">360° panoramic views · Infinity pool</p>
            </div>
          </a>
        </div>
      </div>
    </section>

    <!-- ─── AMENITIES STRIP ─── -->
    <section class="border-y border-zinc-100 bg-white py-12 px-6">
      <div class="mx-auto max-w-6xl flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
        <div class="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
          <span class="material-icons-outlined text-2xl text-cyan-400" aria-hidden="true"
            >pool</span
          >
          Infinity Pool
        </div>
        <div class="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
          <span class="material-icons-outlined text-2xl text-cyan-400" aria-hidden="true">spa</span>
          Luxury Spa
        </div>
        <div class="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
          <span class="material-icons-outlined text-2xl text-cyan-400" aria-hidden="true"
            >restaurant</span
          >
          Fine Dining
        </div>
        <div class="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
          <span class="material-icons-outlined text-2xl text-cyan-400" aria-hidden="true"
            >surfing</span
          >
          Water Sports
        </div>
        <div class="flex items-center gap-2.5 text-sm font-medium text-zinc-500">
          <span class="material-icons-outlined text-2xl text-cyan-400" aria-hidden="true"
            >directions_boat</span
          >
          Private Transfer
        </div>
      </div>
    </section>

    <!-- ─── PACKAGES ─── -->
    <section class="bg-white py-24 px-6">
      <div class="mx-auto max-w-6xl">
        <p class="text-center text-xs font-bold uppercase tracking-[0.32em] text-cyan-500">
          #Our Packages
        </p>
        <h2
          class="mt-4 text-center text-3xl font-bold tracking-tight text-zinc-900 md:text-[2.5rem]"
        >
          Exceptional stay packages for every traveller
        </h2>
        <p class="mt-3 mx-auto max-w-xl text-center text-[15px] leading-7 text-zinc-500">
          Curated for romantic escapes, underwater adventures, and family holidays.
        </p>

        <!-- Asymmetric: featured (col-span-2, row-span-2) + 2 stacked -->
        <div
          class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3"
          style="grid-template-rows: auto auto;"
        >
          <!-- Honeymoon — featured large -->
          <div
            class="group relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2"
            style="min-height: 500px;"
          >
            <img
              src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1100&q=80"
              alt="Honeymoon Escape"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent"
            ></div>
            <div class="absolute inset-0 flex flex-col justify-between p-8">
              <span
                class="self-start rounded-full bg-cyan-500 px-3.5 py-1 text-xs font-bold text-white"
                >5 nights</span
              >
              <div>
                <p class="text-2xl font-bold text-white">Honeymoon Escape</p>
                <p class="mt-2 max-w-sm text-[14px] leading-6 text-white/60">
                  Private overwater villa, sunset dinner above the lagoon, couples spa ritual &
                  guided reef snorkel.
                </p>
                <div class="mt-6 flex items-center justify-between">
                  <div>
                    <p class="text-[11px] text-white/45">From</p>
                    <p class="text-xl font-bold text-white">
                      $1,200 <span class="text-sm font-normal text-white/45">/ night</span>
                    </p>
                  </div>
                  <a
                    routerLink="/rooms/search"
                    class="rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >Book now</a
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Ocean Adventure -->
          <div class="group relative h-60 overflow-hidden rounded-2xl md:h-auto">
            <img
              src="https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=700&q=80"
              alt="Ocean Adventure"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-zinc-950/88 via-zinc-950/15 to-transparent"
            ></div>
            <div class="absolute inset-0 flex flex-col justify-between p-5">
              <span
                class="self-start rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white"
                >7 nights</span
              >
              <div>
                <p class="font-bold text-white text-lg">Ocean Adventure</p>
                <div class="mt-2 flex items-center justify-between">
                  <p class="font-semibold text-white">
                    $900 <span class="text-[11px] font-normal text-white/45">/night</span>
                  </p>
                  <a
                    routerLink="/rooms/search"
                    class="rounded-full border border-white/35 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                    >Book now</a
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Family Getaway -->
          <div class="group relative h-60 overflow-hidden rounded-2xl md:h-auto">
            <img
              src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=700&q=80"
              alt="Family Getaway"
              class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-zinc-950/88 via-zinc-950/15 to-transparent"
            ></div>
            <div class="absolute inset-0 flex flex-col justify-between p-5">
              <span
                class="self-start rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white"
                >4 nights</span
              >
              <div>
                <p class="font-bold text-white text-lg">Family Getaway</p>
                <div class="mt-2 flex items-center justify-between">
                  <p class="font-semibold text-white">
                    $750 <span class="text-[11px] font-normal text-white/45">/night</span>
                  </p>
                  <a
                    routerLink="/rooms/search"
                    class="rounded-full border border-white/35 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                    >Book now</a
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── FAQ ─── -->
    <section class="bg-zinc-50 py-24 px-6">
      <div class="mx-auto max-w-6xl grid grid-cols-1 gap-16 md:grid-cols-2 items-start">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.32em] text-cyan-500">#FAQs</p>
          <h2
            class="mt-4 text-3xl font-bold tracking-tight text-zinc-900 leading-tight md:text-[2.5rem]"
          >
            Frequently Asked Questions
          </h2>
          <p class="mt-5 text-[15px] leading-7 text-zinc-500">
            We believe in clear, honest communication. Here are the questions we hear most from our
            guests.
          </p>
        </div>
        <div class="divide-y divide-zinc-100">
          @for (faq of faqs; track faq.q; let i = $index) {
            <div class="py-5">
              <button
                type="button"
                (click)="toggleFaq(i)"
                class="flex w-full items-center justify-between gap-4 text-left text-[15px] font-semibold text-zinc-800 transition-colors hover:text-cyan-600"
              >
                <span>{{ faq.q }}</span>
                <span
                  class="material-icons-outlined shrink-0 text-xl text-zinc-400 transition-transform duration-200"
                  [style.transform]="openFaq() === i ? 'rotate(180deg)' : 'rotate(0deg)'"
                  aria-hidden="true"
                  >expand_more</span
                >
              </button>
              @if (openFaq() === i) {
                <p class="mt-3 text-[14px] leading-6 text-zinc-500">{{ faq.a }}</p>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ─── REVIEWS ─── -->
    <section class="bg-white py-24 px-6">
      <div class="mx-auto max-w-6xl">
        <p class="text-center text-xs font-bold uppercase tracking-[0.32em] text-cyan-500">
          #Reviews
        </p>
        <h2
          class="mt-4 text-center text-3xl font-bold tracking-tight text-zinc-900 md:text-[2.5rem]"
        >
          Your trusted partner in paradise
        </h2>
        <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          @for (r of reviews; track r.name) {
            <div class="rounded-2xl border border-zinc-100 bg-zinc-50 p-7">
              <div class="mb-4 flex gap-0.5">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <span
                    class="material-icons-outlined text-[16px] text-amber-400"
                    aria-hidden="true"
                    >star</span
                  >
                }
              </div>
              <p class="text-[15px] leading-7 text-zinc-600">"{{ r.text }}"</p>
              <div class="mt-5 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700"
                >
                  {{ r.initials }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-zinc-800">{{ r.name }}</p>
                  <p class="text-xs text-zinc-400">{{ r.role }}</p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ─── CTA ─── -->
    <section class="relative overflow-hidden py-28 px-6">
      <img
        src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2000&q=80"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
        aria-hidden="true"
      />
      <div class="pointer-events-none absolute inset-0 bg-zinc-950/68" aria-hidden="true"></div>
      <div class="relative z-10 mx-auto max-w-3xl text-center">
        <h2 class="text-3xl font-bold tracking-tight text-white leading-tight md:text-5xl">
          Don't wait any longer.<br />Start your Maldives adventure today.
        </h2>
        <p class="mt-5 text-[15px] leading-7 text-white/60">
          Book directly and enjoy our best-rate guarantee, exclusive perks, and personalised
          pre-arrival concierge.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <a
            routerLink="/rooms/search"
            class="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-cyan-400 active:scale-[0.98]"
          >
            <span class="material-icons-outlined text-lg" aria-hidden="true">search</span>
            Browse Rooms
          </a>
          <a
            routerLink="/contact"
            class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >Contact Us</a
          >
        </div>
      </div>
    </section>

    <!-- ─── FOOTER ─── -->
    <footer class="bg-zinc-900 px-6 py-16 text-zinc-400">
      <div class="mx-auto max-w-6xl grid grid-cols-1 gap-10 md:grid-cols-4">
        <div class="md:col-span-2">
          <a
            routerLink="/"
            class="relative block h-18 w-20 shrink-0"
            aria-label="Grand Plaza — home"
          >
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              class="absolute inset-0 h-full w-auto object-contain object-left transition-opacity duration-300"
            />
          </a>
          <p class="mt-3 max-w-xs text-[14px] leading-6">
            Personalised luxury from your own private island in the heart of the Indian Ocean.
          </p>
          <div class="mt-5 flex gap-3 text-zinc-500">
            <span
              class="material-icons-outlined cursor-pointer text-xl transition-colors hover:text-white"
              >language</span
            >
            <span
              class="material-icons-outlined cursor-pointer text-xl transition-colors hover:text-white"
              >phone</span
            >
            <span
              class="material-icons-outlined cursor-pointer text-xl transition-colors hover:text-white"
              >mail</span
            >
          </div>
        </div>
        <div>
          <p class="mb-4 text-sm font-semibold text-white">Navigate</p>
          <div class="space-y-2.5 text-[14px]">
            <a routerLink="/" class="block transition-colors hover:text-white">Home</a>
            <a routerLink="/rooms/search" class="block transition-colors hover:text-white">Rooms</a>
            <a routerLink="/hotel" class="block transition-colors hover:text-white">Hotel Info</a>
            <a routerLink="/contact" class="block transition-colors hover:text-white">Contact</a>
          </div>
        </div>
        <div>
          <p class="mb-4 text-sm font-semibold text-white">Guest Services</p>
          <div class="space-y-2.5 text-[14px]">
            <a routerLink="/login" class="block transition-colors hover:text-white">Sign In</a>
            <a routerLink="/register" class="block transition-colors hover:text-white">Register</a>
            <a routerLink="/rooms/search" class="block transition-colors hover:text-white"
              >Book a Room</a
            >
            <a routerLink="/contact" class="block transition-colors hover:text-white">Support</a>
          </div>
        </div>
      </div>
      <div
        class="mx-auto mt-12 max-w-6xl flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-xs text-zinc-500"
      >
        <p>© {{ year }} Grand Plaza. All rights reserved.</p>
        <div class="flex gap-6">
          <span class="cursor-pointer transition-colors hover:text-white">Privacy Policy</span>
          <span class="cursor-pointer transition-colors hover:text-white">Terms & Conditions</span>
        </div>
      </div>
    </footer>
  `,
})
export class LandingComponent implements AfterViewInit {
  private readonly roomsApi = inject(RoomsApiService);
  private readonly hotelsApi = inject(HotelsApiService);

  readonly openFaq = signal<number | null>(null);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly results = signal<RoomSearchResultItem[]>([]);
  readonly dateError = signal<string | null>(null);
  readonly year = new Date().getFullYear();
  readonly lastSearch = signal<{ checkIn?: string; checkOut?: string; guests?: number }>({});

  // Default dates: today and today+4 days
  readonly defaultCheckIn = new Date();
  readonly defaultCheckOut = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

  // For min attribute on date inputs
  readonly todayDateString = new Date().toISOString().split('T')[0];
  readonly defaultCheckInDateString = this.defaultCheckIn.toISOString().split('T')[0];

  @ViewChild('checkInRef') checkInInput!: ElementRef<HTMLInputElement>;
  @ViewChild('checkOutRef') checkOutInput!: ElementRef<HTMLInputElement>;

  ngAfterViewInit(): void {
    // Optional: Ensure default values are visually set if browser doesn't respect valueAsDate
    if (this.checkInInput) {
      this.checkInInput.nativeElement.valueAsDate = this.defaultCheckIn;
    }
    if (this.checkOutInput) {
      this.checkOutInput.nativeElement.valueAsDate = this.defaultCheckOut;
    }
  }

  search(location: string, checkIn: string, checkOut: string, guests: string): void {
    // Clear previous error
    this.dateError.set(null);

    // Validate required dates
    if (!checkIn) {
      this.dateError.set('Please select a check-in date.');
      return;
    }
    if (!checkOut) {
      this.dateError.set('Please select a check-out date.');
      return;
    }

    // Optional: Validate that check-out is after check-in
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      this.dateError.set('Check-out date must be after check-in date.');
      return;
    }

    if (this.loading()) return;

    const guestCount = guests ? parseInt(guests, 10) : undefined;

    this.lastSearch.set({
      checkIn: checkIn || undefined,
      checkOut: checkOut || undefined,
      guests: guestCount,
    });

    this.loading.set(true);
    this.searched.set(true);
    this.results.set([]);

    setTimeout(
      () => document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' }),
      0,
    );

    this.roomsApi
      .searchRooms({
        location: location || undefined,
        checkIn: checkIn || undefined,
        checkOut: checkOut || undefined,
        guests: guestCount,
      })
      .subscribe({
        next: (r) => {
          this.results.set(r.results);
          this.loading.set(false);
        },
        error: () => {
          this.results.set([]);
          this.loading.set(false);
        },
      });
  }

  toggleFaq(i: number): void {
    this.openFaq.update((v) => (v === i ? null : i));
  }

  readonly destinations = toSignal(this.hotelsApi.getAll(), { initialValue: [] });

  readonly faqs: Faq[] = [
    {
      q: 'How do I book a room at Grand Plaza?',
      a: 'Browse rooms directly on the website, select your preferred villa type and travel dates, then complete your reservation with your guest account. Instant confirmation is sent by email.',
    },
    {
      q: 'What is included in the room rate?',
      a: 'All rates include daily breakfast for two, complimentary snorkelling equipment, high-speed Wi-Fi, and non-motorised water sports. Premium packages add full-board dining and spa credits.',
    },
    {
      q: 'How do I reach the resort from Malé?',
      a: 'Grand Plaza is a 30-minute speedboat transfer or a 15-minute scenic seaplane flight from Velana International Airport. Private transfers in both modes can be arranged at the time of booking.',
    },
    {
      q: 'What is the cancellation policy?',
      a: 'Bookings cancelled 14 or more days before check-in receive a full refund. Cancellations within 14 days incur a one-night retention fee. No-shows are non-refundable.',
    },
    {
      q: 'Do you host destination weddings or private events?',
      a: 'Yes — we specialise in intimate beach ceremonies, sunset lagoon dinners, and corporate retreats. Contact our events concierge team for a bespoke proposal.',
    },
  ];

  readonly reviews: Review[] = [
    {
      name: 'Sophia Linden',
      role: 'Honeymooner · United Kingdom',
      text: 'An absolute dream from start to finish. The overwater bungalow was breathtaking, and the staff anticipated our every need before we even thought to ask. Already planning our anniversary return.',
      initials: 'SL',
    },
    {
      name: 'James Whitfield',
      role: 'Business Traveller · Australia',
      text: 'Impeccable service paired with jaw-dropping surroundings. The glass-floor bungalow and private sun deck made this the most luxurious trip I have ever taken.',
      initials: 'JW',
    },
    {
      name: 'Aisha Rahman',
      role: 'Family Holiday · UAE',
      text: 'The family villa was perfect for all of us. Our children loved the marine biologist snorkel tour and the shallows reef — they have not stopped talking about it since we got home.',
      initials: 'AR',
    },
    {
      name: 'Marcus Chen',
      role: 'Solo Traveller · Singapore',
      text: 'I booked for a week and wanted to stay indefinitely. The sunset deck dinners, the spa, and the quiet of the private island are beyond anything I have experienced before.',
      initials: 'MC',
    },
  ];
}
