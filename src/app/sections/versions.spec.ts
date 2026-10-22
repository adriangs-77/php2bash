import { Versions } from './versions';

function verdictFor(version: string) {
  const component = new Versions();
  (component as any).version.set(version);
  return (component as any).verdict();
}

describe('Versions checker', () => {
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
