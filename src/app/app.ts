import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      this.initTheme();
      this.initScroll();
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
