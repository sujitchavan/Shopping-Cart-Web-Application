import type { TypedStartListening } from '@reduxjs/toolkit';
import type { RootState } from './rootReducer';

/**
 * Typed `startListening`. Features register their side effects through functions that take this,
 * so each store instance (app or test) gets its own middleware and listeners.
 */
export type AppStartListening = TypedStartListening<RootState>;
