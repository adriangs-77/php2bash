import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the dossier title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1')?.textContent ?? '';
    expect(h1).toContain('PHP');
    expect(h1).toContain('bash');
  });

  it('should apply an accessible palette for colour blindness', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const toggle = el.querySelector('.cvd-btn') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    await fixture.whenStable();

    const option = el.querySelector('[data-swatch="deuteranopia"]') as HTMLButtonElement;
    expect(option).toBeTruthy();
    option.click();
    await fixture.whenStable();

    expect(document.documentElement.getAttribute('data-cvd')).toBe('deuteranopia');
    expect(el.querySelector('.cvd-menu')).toBeNull();
  });

  it('should render the main sections', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    for (const id of ['resumen', 'versiones', 'twintech', 'deteccion', 'faq']) {
      expect(compiled.querySelector('#' + id), id).toBeTruthy();
    }
  });
});
