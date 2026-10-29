import { createSelector } from '@reduxjs/toolkit';
import { catalogApi } from '@/features/catalog';
import {
  cartSubtotalCents,
  payableItemCount,
  priceCartLines,
  selectCartLines,
} from '@/features/cart';
import type { RootState } from './rootReducer';

/**
 * The one place that joins cart lines with live catalogue prices. It lives in store/ so neither
 * feature has to import the other's internals (cart never depends on catalog).
 */
const selectCatalogProducts = (state: RootState) =>
  catalogApi.endpoints.getProducts.select(undefined)(state).data;

export const selectCartLinesWithPricing = createSelector(
  [selectCartLines, selectCatalogProducts],
  priceCartLines,
);

export const selectCartSubtotalCents = createSelector(
  [selectCartLinesWithPricing],
  cartSubtotalCents,
);

export const selectPayableItemCount = createSelector(
  [selectCartLinesWithPricing],
  payableItemCount,
);
