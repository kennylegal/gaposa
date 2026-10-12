import { describe,it,expect } from 'vitest';
import { age,initials,daysUntil,money } from '../ui/format.js';
describe('format',()=>{
    it('age',()=>{expect(age('2000-01-01')).toBeGreaterThan(24)});
    it('initials',()=>{expect(initials({firstName:'Ada',lastName:'Okonkwo'})).toBe('AO')});
    it('missing initials',()=>{expect(initials({})).toBe('?')});
    it('money',()=>{expect(money(1234.5)).toBe('₦1,234.50')});
});
