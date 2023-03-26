import type {
  CombinedState,
  AnyAction,
  Reducer,
  StateFromReducersMapObject,
} from 'redux'
import type { Slice } from './createSlice'
import { configureStore } from './configureStore'
import type {
  Id,
  UnionToIntersection,
  WithOptionalProp,
  WithRequiredProp,
} from './tsHelpers'
import { createSelector } from 'reselect'

type AnySlice = Slice<any, any, any>

type ReducerMap = Record<string, Reducer>

type SliceState<Sl extends AnySlice> = Sl extends Slice<infer State, any, any>
  ? State
  : never

type SliceName<Sl extends AnySlice> = Sl extends Slice<any, any, infer Name>
  ? Name
  : never

export type WithSlice<Sl extends AnySlice> = Id<
  {
    [K in SliceName<Sl>]: SliceState<Sl>
  }
>

// only allow injection of slices we've already declared
type LazyLoadedSlice<LazyLoadedState extends Record<string, unknown>> = {
  [Name in keyof LazyLoadedState]: Name extends string
    ? Slice<LazyLoadedState[Name], any, Name>
    : never
}[keyof LazyLoadedState]

type LazyLoadedReducerMap<LazyLoadedState extends Record<string, unknown>> = {
  [Name in keyof LazyLoadedState]?: Reducer<LazyLoadedState[Name]>
}

type CombinedSliceState<
  StaticState,
  LazyLoadedState extends Record<string, unknown> = {},
  InjectedKeys extends keyof LazyLoadedState = never
> = Id<
  // TODO: use PreloadedState generic instead
  CombinedState<
    StaticState & WithRequiredProp<Partial<LazyLoadedState>, InjectedKeys>
  >
>

type NewKeys<
  LazyLoadedState extends Record<string, unknown>,
  Slices extends [
    LazyLoadedSlice<LazyLoadedState> | LazyLoadedReducerMap<LazyLoadedState>,
    ...Array<
      LazyLoadedSlice<LazyLoadedState> | LazyLoadedReducerMap<LazyLoadedState>
    >
  ]
> = Slices[number] extends infer Slice
  ? Slice extends AnySlice
    ? SliceName<Slice>
    : keyof Slice
  : never

interface CombinedSliceReducer<
  StaticState,
  LazyLoadedState extends Record<string, unknown> = {},
  InjectedKeys extends keyof LazyLoadedState = never
> extends Reducer<
    CombinedSliceState<StaticState, LazyLoadedState, InjectedKeys>,
    AnyAction
  > {
  withLazyLoadedSlices<
    Lazy extends Record<string, unknown>
  >(): CombinedSliceReducer<StaticState, LazyLoadedState & Lazy, InjectedKeys>

  injectSlices<
    Slices extends [
      LazyLoadedSlice<LazyLoadedState> | LazyLoadedReducerMap<LazyLoadedState>,
      ...Array<
        LazyLoadedSlice<LazyLoadedState> | LazyLoadedReducerMap<LazyLoadedState>
      >
    ]
  >(
    ...slices: Slices
  ): CombinedSliceReducer<
    StaticState,
    LazyLoadedState,
    InjectedKeys | NewKeys<LazyLoadedState, Slices>
  >

  // TODO: deal with nested state?
  selector<
    Selected,
    State extends CombinedSliceState<
      StaticState,
      LazyLoadedState,
      InjectedKeys
    >,
    Args extends any[]
  >(
    selectorFn: (state: State, ...args: Args) => Selected
  ): (state: WithOptionalProp<State, InjectedKeys>, ...args: Args) => Selected
}

type StaticState<
  Slices extends [AnySlice | ReducerMap, ...Array<AnySlice | ReducerMap>]
> = UnionToIntersection<
  Slices[number] extends infer Slice
    ? Slice extends AnySlice
      ? WithSlice<Slice>
      : StateFromReducersMapObject<Slice>
    : never
>

declare const combineSlices: <
  Slices extends [AnySlice | ReducerMap, ...Array<AnySlice | ReducerMap>]
>(
  ...slices: Slices
) => CombinedSliceReducer<Id<StaticState<Slices>>>

// test it works

declare const fooSlice: Slice<'foo', {}, 'foo'>

declare const barReducer: Reducer<'bar'>

declare const bazSlice: Slice<'baz', {}, 'baz'>

const baseReducer = combineSlices(fooSlice, {
  bar2: barReducer,
}).withLazyLoadedSlices<
  WithSlice<typeof bazSlice> & {
    bar2: ReturnType<typeof barReducer>
  }
>()

const store = configureStore({
  reducer: baseReducer,
})

type RootState = ReturnType<typeof store.getState>

const withoutInjection = baseReducer.selector((state) => state.baz)

const selector1 = withoutInjection(store.getState())
//    ^?

const withInjection = baseReducer
  .injectSlices(bazSlice, {
    bar2: barReducer,
  })
  .selector((state) => state.baz)

const selector2 = withInjection(store.getState())
//    ^?

const memoizedWithoutInjection = baseReducer.selector(
  createSelector(
    // can't be inferred
    (state: RootState & WithSlice<typeof bazSlice>) => state.baz,
    (_: unknown, id: string) => id,
    (state, id) => `${state?.length}${id}` as const
  )
)

// @ts-expect-error doesn't guarantee injection, so errors
const selector3 = memoizedWithoutInjection(store.getState(), 'id')
//    ^?

const memoizedWithInjection = baseReducer.injectSlices(bazSlice).selector(
  createSelector(
    // can't be inferred
    (state: RootState & WithSlice<typeof bazSlice>) => state.baz,
    (_: unknown, id: string) => id,
    (state, id) => `${state.length}${id}` as const
  )
)

const selector4 = memoizedWithInjection(store.getState(), 'id')
//    ^?