# ADR-001: State management

## Initial suggestion: Zustand

In planning mode, the AI first suggested **Zustand** for the cart, based on the current scope of
the assignment: one cart, one catalogue endpoint and two pages. For that scope, Zustand has the
least boilerplate and the smallest bundle. Its selector subscriptions also mean that adding a
product doesn't re-render the whole grid.

## Change to Redux Toolkit, and why

I asked for the plan to be updated to use **Redux Toolkit** instead. This application is meant
to expand to features such as **checkout, address and dashboard**, each with its own state. With
that many states, the choice is about how well the store handles all of them in one consistent
way, not about today's single cart.

Redux Toolkit gives every new feature the same pattern:

- its own slice, or RTK Query endpoints for server data
- registration through `combineSlices` / `injectEndpoints`
- side effects (such as persistence) in listener middleware

Zustand leaves that structure up to each feature, so as more features and states are added, the
stores tend to differ from one another.

These features also have to react to each other: placing an order clears the cart, and changing
the address changes the checkout total. In Redux, every change is an action the whole store sees,
so a listener or selector in one feature can respond without importing the other feature. In
Zustand, each store is separate, so that wiring has to be built by hand between stores.
