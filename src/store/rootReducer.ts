import { combineSlices } from '@reduxjs/toolkit';
import { cartSlice } from '@/features/cart';
import { baseApi } from '@/shared/api';

/**
 * Future features either add themselves here or call `slice.injectInto(rootReducer)` from their
 * lazy route, so their code is only loaded when needed. API endpoints never come here: features
 * inject them into `baseApi`, whose single reducer is registered below.
 */
export const rootReducer = combineSlices(cartSlice, baseApi);

export type RootState = ReturnType<typeof rootReducer>;
