import {describe,it,expect} from 'vitest';
import {webcrypto} from 'node:crypto';
import {browserId} from '../packages/shared/src/browser-id';
describe('Browser idempotency identifiers',()=>{
  it('works without randomUUID on an insecure LAN origin',()=>{
    const source={getRandomValues:webcrypto.getRandomValues.bind(webcrypto)} as Pick<Crypto,'getRandomValues'>;
    const ids=Array.from({length:100},()=>browserId(source));
    expect(new Set(ids).size).toBe(100);
    expect(ids.every(id=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))).toBe(true);
  });
  it('uses the native implementation when available',()=>{
    const id=browserId({randomUUID:()=> '12345678-1234-4123-8123-123456789abc',getRandomValues:()=>{throw new Error('Fallback should not be called');}});
    expect(id).toBe('12345678-1234-4123-8123-123456789abc');
  });
});
