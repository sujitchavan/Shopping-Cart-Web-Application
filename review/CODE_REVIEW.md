# Code review: cart rows re-render on every quantity change

**Pull request:** [#18: improved cart page performance](https://github.com/sujitchavan/Shopping-Cart-Web-Application/pull/18)
(commit `1ede509`)
**Files:** `src/pages/CartPage/CartPage.tsx`, `src/features/cart/components/CartLineItem/CartLineItem.tsx`

## Problem

Clicking "+" on **one** cart item re-rendered **every** row in the cart (image, stepper, buttons).
The cost grows with the number of items in the cart.

## Cause

```tsx
// CartPage.tsx (before)
{lines.map((line) => (
  <CartLineItem
    line={line}
    onIncrement={() => dispatch(increment(line.productId))} // new function every render
    onDecrement={() => dispatch(decrement(line.productId))} // new function every render
    onRemove={() => handleRemove(line.productId, line.title)} // new function every render
    removeButtonRef={(element) => { ... }} // new ref callback every render
  />
))}
```

1. `CartLineItem` was not wrapped in `memo`, so it re-rendered whenever `CartPage` did.
2. Every row got new arrow functions on each render, so props were never equal.
3. `priceCartLines` builds new line objects on each cart change, so `line` was always a new
   reference, even for unchanged rows.
4. The inline ref callback made React detach and re-attach each Remove button's ref on every
   render.

## Fix

```tsx
// CartPage.tsx (after): one stable function shared by all rows
const handleIncrement = useCallback(
  (productId: number) => dispatch(increment(productId)),
  [dispatch],
);

<CartLineItem
  line={line}
  onIncrement={handleIncrement}
  onDecrement={handleDecrement}
  onRemove={handleRemove} // reads current lines from the store at click time
  registerRemoveButton={registerRemoveButton}
/>;
```

```tsx
// CartLineItem.tsx (after): skip the render unless this row's values changed
function sameLine(a: PricedCartLine, b: PricedCartLine): boolean {
  return (Object.keys(a) as (keyof PricedCartLine)[]).every((key) => a[key] === b[key]);
}

export const CartLineItem = memo(function CartLineItem(...) { ... }, propsEqual);
```

| Cause                 | Fix                                                                |
| --------------------- | ------------------------------------------------------------------ |
| No `memo`             | `CartLineItem` wrapped in `memo`                                   |
| New callbacks per row | Callbacks take `productId` and are created once with `useCallback` |
| New `line` object     | `memo` compares the line's values (`sameLine`), not the object     |
| Ref re-attached       | Stable `registerRemoveButton`, wrapped per row with `useCallback`  |

## Result

- Clicking "+" now re-renders only the changed row, plus the summary and badge that show the new
  totals.
- Behaviour is unchanged: totals, announcements and focus after Remove work as before.
- New test `CartPage.rerender.test.tsx` **failed before the fix** and passes after it. All unit
  tests, lint, typecheck and Playwright (Chromium) pass.
