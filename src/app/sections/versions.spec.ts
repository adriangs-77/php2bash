import { Versions } from './versions';

function verdictFor(version: string) {
  const component = new Versions();
  (component as any).version.set(version);
  return (component as any).verdict();
}

describe('Versions checker', () => {
  it('does not reveal a verdict until the user asks for it', () => {
    const c = new Versions();
    expect((c as any).checked()).toBe(false);
    (c as any).check();
    expect((c as any).checked()).toBe(true);
  });

  it('enables the button only for parseable versions', () => {
    const c = new Versions();
    (c as any).version.set('8.3.35');
    expect((c as any).hasInput()).toBe(true);
    (c as any).version.set('vamos');
    expect((c as any).hasInput()).toBe(false);
    (c as any).version.set('');
    expect((c as any).hasInput()).toBe(false);
  });

  it('clicking an example fills the input and hides the previous verdict', () => {
    const c = new Versions();
    (c as any).check();
    (c as any).use('8.2.34');
    expect((c as any).version()).toBe('8.2.34');
    expect((c as any).checked()).toBe(false);
  });

  it('flags PHP 8.3.35 as vulnerable and points to 8.3.36', () => {
    const v = verdictFor('8.3.35');
    expect(v.status).toBe('bad');
    expect(v.headline).toContain('8.3.36');
  });

  it('accepts exactly the fixed builds', () => {
    for (const version of ['8.2.35', '8.3.36', '8.4.27', '8.5.12']) {
      expect(verdictFor(version).status, version).toBe('ok');
    }
  });

  it('shows the entered version verbatim in the headline', () => {
    expect(verdictFor('8.4.27').headline).toBe('Parcheada (8.4.27)');
    expect(verdictFor('8.2.34').headline).toContain('8.2.35');
  });

  it('accepts common paste formats', () => {
    expect(verdictFor('PHP 8.3.35').status).toBe('bad');
    expect(verdictFor(' 8.3.36 ').status).toBe('ok');
  });

  it('accepts versions above the fixed build', () => {
    expect(verdictFor('8.4.28').status).toBe('ok');
    expect(verdictFor('8.5.13').status).toBe('ok');
  });

  it('flags end-of-life branches', () => {
    const v = verdictFor('7.4.33');
    expect(v.status).toBe('bad');
    expect(v.headline).toContain('sin soporte');
  });

  it('handles malformed input', () => {
    expect(verdictFor('vamos').status).toBe('unknown');
  });
});
