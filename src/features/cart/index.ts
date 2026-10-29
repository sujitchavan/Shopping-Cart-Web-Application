// Public API of the cart feature. Other modules import from here, never from internals.
export { AddToCartButton } from './components/AddToCartButton/AddToCartButton';
export { CartBadge } from './components/CartBadge/CartBadge';
export { CartLineItem } from './components/CartLineItem/CartLineItem';
export { CartSummary } from './components/CartSummary/CartSummary';
export { ClearCartDialog } from './components/ClearCartDialog/ClearCartDialog';
export { EmptyCart } from './components/EmptyCart/EmptyCart';
export { QuantityStepper } from './components/QuantityStepper/QuantityStepper';
export { StorageNotice } from './components/StorageNotice/StorageNotice';

export {
  useAddToCart,
  useCartCount,
  useCartIsPersistent,
  useCartLine,
  useCartLineCount,
  useCrossTabCartSync,
} from './hooks/useCart';

export {
  cartSubtotalCents,
  payableItemCount,
  priceCartLines,
  type LiveProductPrice,
  type PricedCartLine,
} from './model/cartPricing';
export {
  emptyCart,
  parseCart,
  serializeCart,
  type CartLine,
  type CartState,
  type ProductSnapshot,
} from './model/cartSchema';
export {
  selectCartItemCount,
  selectCartLine,
  selectCartLineCount,
  selectCartLines,
} from './model/cartSelectors';
export {
  addItem,
  cartHydrated,
  cartSlice,
  clear,
  decrement,
  increment,
  removeItem,
  setQuantity,
} from './model/cartSlice';
export { MAX_QTY_PER_LINE, maxQuantityFor } from './model/policies';
export { addCartPersistenceListener } from './persistence/cartListeners';
export { CART_STORAGE_KEY, loadCart, saveCart } from './persistence/cartStorage';
