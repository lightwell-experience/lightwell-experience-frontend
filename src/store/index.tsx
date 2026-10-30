/* eslint-disable @typescript-eslint/no-explicit-any */
import { Middleware } from 'redux';
import { ReducerRegistry } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry/index';

let registry: any;

export const restoreStore = () => {
  registry = undefined;
};

export const initStore = <State, Reducer extends Record<string, any>>(
  initialState?: State,
  reducer?: Reducer,
  ...middleware: Middleware[]
) => {
  if (registry) {
    throw new Error('store already initialized');
  }

  registry = new ReducerRegistry(initialState ?? {}, [...middleware]);

  registry.register({
    ...(reducer ?? {}),
  });

  return registry;
};

export const createStore = (...middleware: Middleware[]) => initStore({}, {}, ...middleware);
