export type Primitive = string | number | boolean | null | undefined;

export const isPrimitive = (value: Serializable): value is Primitive =>
	value == null || typeof value !== "object";

export type Serializable =
	| Primitive
	| Serializable[]
	| { [key: string]: Serializable };

export type SerializableObject = Record<string, Serializable>;

export type SerializedTuple = [] | [
	Primitive | Serialized,
	...(Primitive | Serialized)[]
];

export type Serialized = Primitive | SerializedTuple;

export type TypedSerialized<Ttype> = [Ttype, ...SerializedTuple];
