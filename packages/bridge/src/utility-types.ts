export type IsNullable<T,K> = undefined extends T ? K : never;
export type NullableKeys<T> = { [K in keyof T]-?: IsNullable<T[K], K> }[keyof T]

export type ExcludeNullableFields<T> = Omit<T, NullableKeys<T>>

export type GetFirstField<T> = T[keyof T]

export type FindNonNullableField<T> = GetFirstField<ExcludeNullableFields<T>>

type ByDefault<T, B> = [T] extends [never] ? B : T

export type Mapping<P, Mapper extends Record<string, unknown[]>, M extends number, N extends number> = ByDefault<FindNonNullableField<{
  [KK in keyof Mapper]: P extends Mapper[KK][M] ? (Mapper[KK][N] extends undefined ? P : Mapper[KK][N]): never
}>, P>

export type ObjectMapping<P, Mapper extends Record<string, unknown[]>, M extends number, N extends number> = {
  [K in keyof P]: Mapping<P[K], Mapper, M, N>
}
