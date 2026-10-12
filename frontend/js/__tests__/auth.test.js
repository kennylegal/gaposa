import { describe,it,expect,beforeEach } from 'vitest';
import { can,login,logout } from '../auth.js';
describe('auth',()=>{
    beforeEach(()=>logout());
    it('pharmacist dispenses',async()=>{await login('pharmacist','pharmacist123');
        expect(can('rx.dispense')).toBe(true)});
    it('nurse cannot dispense',async()=>{await login('nurse','nurse123');
        expect(can('rx.dispense')).toBe(false)});
    it('doctor can create prescription',async()=>{await login('doctor','doctor123');
        expect(can('rx.create')).toBe(true);expect(can('rx.dispense')).toBe(false)});
    it('admin does anything',async()=>{await login('admin','admin123');
        expect(can('anything.at.all')).toBe(true)});
    it('rejects wrong password',async()=>{await expect(login('doctor','wrong')).rejects.toThrow()});
});
