import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Hero } from './sections/hero';
import { Summary } from './sections/summary';
import { Timeline } from './sections/timeline';
import { Incident } from './sections/incident';
import { Versions } from './sections/versions';
import { Fixes } from './sections/fixes';
import { Twintech } from './sections/twintech';
import { Detection } from './sections/detection';
import { Context } from './sections/context';
import { Faq } from './sections/faq';

interface NavItem {
  id: string;
  label: string;
}

type CvdMode = 'default' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'mono';

interface CvdOption {
  id: CvdMode;
  label: string;
  hint: string;
}

const CVD_STORAGE_KEY = 'php2bash-cvd';
const CVD_MODES: CvdMode[] = ['default', 'deuteranopia', 'protanopia', 'tritanopia', 'mono'];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Hero, Summary, Timeline, Incident, Versions, Fixes, Twintech, Detection, Context, Faq],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly nav: NavItem[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'descubrimiento', label: 'Origen' },
    { id: 'vulnerabilidad', label: 'El fallo' },
    { id: 'versiones', label: 'Versiones' },
    { id: 'soluciones', label: 'Soluciones' },
    { id: 'twintech', label: 'Twintech' },
    { id: 'deteccion', label: 'Detección' },
    { id: 'contexto', label: 'Contexto' },
    { id: 'faq', label: 'FAQ' },
  ];

  protected readonly active = signal('resumen');
  protected readonly progress = signal(0);
  protected readonly theme = signal<'dark' | 'light'>('dark');

  /** Paleta para daltonismo: por defecto, o una de las cuatro paletas accesibles. */
  protected readonly cvdOptions: CvdOption[] = [
    { id: 'default', label: 'Color original', hint: 'Paleta del dossier, sin ajustes' },
    { id: 'deuteranopia', label: 'Deuteranopía', hint: 'Verde y rojo se confunden: uso azul, violeta y ámbar' },
    { id: 'protanopia', label: 'Protanopía', hint: 'El rojo se ve oscuro: refuerzo de luminosidad' },
    { id: 'tritanopia', label: 'Tritanopía', hint: 'Azul y amarillo se confunden: verdes y magentas' },
    { id: 'mono', label: 'Monocromo', hint: 'Sin color, jerarquía por luminosidad' },
  ];
  protected readonly cvd = signal<CvdMode>('default');
  /** Reloj UTC vivo: refuerza la cronología del incidente. */
  protected readonly clock = signal('--:--:--');
  protected readonly cvdMenuOpen = signal(false);
  protected readonly cvdActiveLabel = computed(
    () => this.cvdOptions.find((o) => o.id === this.cvd())?.label ?? 'Color original',
  );

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.initTheme();
      this.initCvd();
      this.initScroll();
      this.initMenuDismiss();
      this.initClock();
      this.initShortcuts();
    });
  }

  protected toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('php2bash-theme', next);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  protected toggleCvdMenu(): void {
    this.cvdMenuOpen.update((open) => !open);
  }

  protected selectCvd(mode: CvdMode): void {
    this.cvd.set(mode);
    this.cvdMenuOpen.set(false);
    this.applyCvd(mode);
    try {
      localStorage.setItem(CVD_STORAGE_KEY, mode);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private initCvd(): void {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(CVD_STORAGE_KEY);
    } catch {
      stored = null;
    }
    const mode = CVD_MODES.includes(stored as CvdMode) ? (stored as CvdMode) : 'default';
    this.cvd.set(mode);
    this.applyCvd(mode);
  }

  private applyCvd(mode: CvdMode): void {
    if (mode === 'default') {
      document.documentElement.removeAttribute('data-cvd');
    } else {
      document.documentElement.setAttribute('data-cvd', mode);
    }
  }

  private initClock(): void {
    const tick = () => {
      const now = new Date();
      this.clock.set(now.toISOString().slice(11, 19));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    this.destroyRef.onDestroy(() => window.clearInterval(id));
  }

  /** Atajos: t = tema, c = menú de paletas, esc = cerrar menú. */
  private initShortcuts(): void {
    const onKeydown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 't') {
        event.preventDefault();
        this.toggleTheme();
      } else if (key === 'c') {
        event.preventDefault();
        this.toggleCvdMenu();
      }
    };
    document.addEventListener('keydown', onKeydown);
    this.destroyRef.onDestroy(() => document.removeEventListener('keydown', onKeydown));
  }

  private initMenuDismiss(): void {
    const onPointerDown = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.cvd')) {
        this.cvdMenuOpen.set(false);
      }
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.cvdMenuOpen.set(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeydown);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeydown);
    });
  }

  private initTheme(): void {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem('php2bash-theme');
    } catch {
      stored = null;
    }
    const prefersLight =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: light)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : prefersLight ? 'light' : 'dark';
    this.theme.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  private initScroll(): void {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      this.progress.set(max > 0 ? Math.min(100, Math.max(0, (doc.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const sections = Array.from(document.querySelectorAll<HTMLElement>('section[id], header[id]'));
    let observer: IntersectionObserver | undefined;

    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length > 0) {
            const id = visible[0].target.id;
            if (this.nav.some((n) => n.id === id)) {
              this.active.set(id);
            }
          }
        },
        { rootMargin: '-30% 0px -55% 0px', threshold: [0.01, 0.2, 0.5] },
      );
      sections.forEach((s) => observer?.observe(s));
    }

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      observer?.disconnect();
    });
  }
}
