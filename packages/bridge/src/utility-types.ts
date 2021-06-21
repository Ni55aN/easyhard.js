export type IsNullable<T,K> = undefined extends T ? K : never;
export type NullableKeys<T> = { [K in keyof T]-?: IsNullable<T[K], K> }[keyof T]

export type ExcludeNullableFields<T> = Omit<T, NullableKeys<T>>

export type GetFirstField<T> = T[keyof T]

export type FindNonNullableField<T> = GetFirstField<ExcludeNullableFields<T>>
