import { it, expect } from 'vitest';
import { selectFarm, setLocale } from '../src/features/ui/ui.slice';
import { makeStore } from '../src/store';
it('keeps farm selection and locale in Redux without credentials', () => {
  const s = makeStore();
  s.dispatch(selectFarm('farm-1'));
  s.dispatch(setLocale('hi'));
  expect(s.getState().ui).toEqual({ selectedFarmId: 'farm-1', locale: 'hi' });
  expect(JSON.stringify(s.getState())).not.toContain('accessToken');
});
