import { combineSlices } from '@reduxjs/toolkit';
import { catalogApi } from '@/features/catalog';
import { cartSlice } from '@/features/cart';

/**
 * Future features either add themselves here or call `slice.injectInto(rootReducer)` from their
 * lazy route, so their code is only loaded when needed.
 */
export const rootReducer = combineSlices(cartSlice, catalogApi);

export type RootState = ReturnType<typeof rootReducer>;
