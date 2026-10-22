import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-wrap">
      <div class="code-head">
        <span class="label">{{ label() }}</span>
        <button
          type="button"
          class="copy-btn"
          [class.copied]="copied()"
          (click)="copy()"
          [attr.aria-label]="'Copiar ' + label()"
        >
          {{ copied() ? '✓ copiado' : 'copiar' }}
        </button>
      </div>
      <pre><code>{{ code() }}</code></pre>
    </div>
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly label = input<string>('shell');
  protected readonly copied = signal(false);

  async copy(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* portapapeles no disponible: el usuario puede seleccionar el texto */
    }
  }
}
