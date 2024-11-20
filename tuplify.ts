import { serializeToTuples, toJSON } from "./utils.ts";
import {
	Serializable,
	SerializableObject,
	SerializedTuple,
	TypedSerialized,
	isPrimitive,
} from "./types.ts";

export default function tuplify<
	TRepresentativesDict extends Record<
		string,
		{ type: string } & SerializableObject
	>
>(representatives: TRepresentativesDict) {
	type TypedObject<Ttype extends string> =
		Ttype extends keyof TRepresentativesDict
			? {
					type: Ttype;
			  } & Omit<TRepresentativesDict[Ttype], "type">
			: never;

	function serializeWithType<
		Ttype extends keyof TRepresentativesDict & string
	>(target: TypedObject<Ttype>): TypedSerialized<Ttype> {
		const { type, ...data } = target;

		const representative = representatives[type];
		if (!representative || typeof representative !== "object") {
			throw new Error(`No representative found for type: ${type}`);
		}

		const { type: _rType, ...rData } = representative;
		return [
			type,
			...(serializeToTuples(
				data,
				// @ts-expect-error - TODO: fix this
				rData
			) as Serializable[]),
		] as TypedSerialized<Ttype>;
	}

	function deserializationProxyWrapper<
		Ttype extends keyof TRepresentativesDict & string
	>(serialized: TypedSerialized<Ttype>): TypedObject<Ttype> {
		const [type, ...data] = serialized;

		const representative = representatives[type];
		if (!representative || typeof representative !== "object") {
			throw new Error(`No representative found for type: ${type}`);
		}

		function createProxy(
			rep: SerializableObject | Serializable[],
			data: SerializedTuple
		): SerializableObject | Serializable[] {
			if (!rep || typeof rep !== "object") {
				throw new Error("Representative must be a non-null object.");
			}
			const repKeys = Object.keys(rep);
			if (!Array.isArray(rep) && repKeys.length !== data.length) {
				throw new Error(
					`Serialized data is missing required fields: ${repKeys
						.slice(data.length - 1)
						.join(", ")}`
				);
			}

			return new Proxy(
				Array.isArray(rep) ? [] : {}, // Use [] for arrays, {} for objects
				{
					get(_, prop: string | symbol) {
						if (prop === "toJSON") {
							// Recursively serialize the data back into JSON-compatible format
							return () =>
								Array.isArray(rep)
									? data.map((item, index) =>
											isPrimitive(item)
												? item
												: createProxy(
														rep[0] as SerializableObject,
														item
														// @ts-expect-error need to fix
												  ).toJSON()
									  )
									: toJSON(rep, data);
						}

						if (prop === Symbol.iterator && Array.isArray(data)) {
							return data[Symbol.iterator].bind(data);
						}

						if (prop === Symbol.toStringTag) {
							return Array.isArray(rep) ? "Array" : "Object";
						}

						if (Array.isArray(rep)) {
							// Handle array-specific properties
							if (prop === "length") return data.length;
							if (
								typeof prop === "symbol" ||
								isNaN(Number(prop))
							) {
								throw new Error(
									`Invalid array property: ${String(prop)}`
								);
							}
							const index = Number(prop);
							const dataValue = data[index];

							return isPrimitive(dataValue)
								? dataValue
								: createProxy(
										rep[0] as SerializableObject,
										dataValue
								  );
						}

						if (typeof prop !== "string") {
							throw new Error(
								`Unsupported property access: ${String(prop)}`
							);
						}

						const index = repKeys.indexOf(prop);

						if (index === -1) {
							throw new Error(
								`Property "${prop}" does not exist in the representative. ${JSON.stringify(
									rep
								)}`
							);
						}

						const repValue = rep[prop];
						const dataValue = data[index];

						if (isPrimitive(dataValue)) return dataValue;

						if (Array.isArray(repValue)) {
							// prop === "hobbies" && console.log(prop);
							const repSubValue = repValue[0];

							// console.log(repSubValue);
							return isPrimitive(repSubValue)
								? dataValue
								: dataValue.map((item) => {
										// console.log({ item });
										return createProxy(
											repSubValue,
											item as SerializedTuple
										);
								  });
						}

						if (repValue !== null && typeof repValue === "object") {
							// Recursively wrap nested objects
							if (!Array.isArray(dataValue)) {
								throw new Error(
									`Expected array or object for nested data at property "${prop}".`
								);
							}
							return createProxy(
								repValue as SerializableObject,
								dataValue
							);
						}

						return dataValue;
					},
					ownKeys() {
						return Array.isArray(rep)
							? Reflect.ownKeys(data)
							: Reflect.ownKeys(rep);
					},
					getOwnPropertyDescriptor(_, prop: string | symbol) {
						// console.log(`Accessed Property Descriptors`);
						if (Array.isArray(rep)) {
							return Object.getOwnPropertyDescriptor(data, prop);
						}

						if (prop in rep) {
							return {
								enumerable: true,
								configurable: true,
								value:
									typeof prop === "string" &&
									data[repKeys.indexOf(prop)],
							};
						}

						return undefined;
					},
				}
			);
		}

		const { type: _, ...rData } = representative;
		return {
			type,
			...createProxy(rData as SerializableObject, data),
		} as TypedObject<Ttype>;
	}

	return [serializeWithType, deserializationProxyWrapper] as const;
}
