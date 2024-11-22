import {
	isPrimitive,
	Primitive,
	Serializable,
	SerializableObject,
	Serialized,
	SerializedTuple,
} from "./types.ts";

export function serializeToTuples<TObj extends Serializable, TRep extends TObj>(
	obj: TObj,
	rep: TRep = obj as TRep
): TRep extends Primitive ? Primitive : SerializedTuple {
	if (isPrimitive(obj)) {
		return obj as unknown as TRep extends Primitive ? Primitive : SerializedTuple;
	}

	if (Array.isArray(rep) && Array.isArray(obj)) {
		return obj.map((item) =>
			serializeToTuples(item, rep[0])
		) as unknown as TRep extends Primitive ? Primitive : SerializedTuple;;
	}

	if (
		rep &&
		typeof rep === "object" &&
		!Array.isArray(obj) &&
		!Array.isArray(rep)
	) {
		return Object.entries(rep).map(([key, repValue]) => {
			const objValue = obj[key];
			return repValue !== null &&
				typeof repValue === "object" &&
				!isPrimitive(objValue)
				? serializeToTuples(objValue, repValue)
				: objValue ?? null;
		}) as unknown as TRep extends Primitive ? Primitive : SerializedTuple;;
	}

	throw new Error(`Invalid structure encountered during serialization.`);
}

export const toJSON = <TRep extends Serializable>(
	rep: TRep,
	data: Serialized
): TRep => {
	if (isPrimitive(data)) {
		return data as TRep;
	} else if (isPrimitive(rep)) {
		throw new Error(`Expected non-primitive value, received ${rep}`);
	}

	if (Array.isArray(rep)) {
		return data.map((item) => toJSON(rep[0], item)) as TRep;
	}

	const result: Record<string, unknown> = {};
	Object.keys(rep).forEach((key, index) => {
		const repValue = rep[key];
		const dataValue = data[index];

		result[key] =
			repValue !== null && typeof repValue === "object"
				? toJSON(repValue as SerializableObject, dataValue)
				: dataValue;
	});
	return result as TRep;
};
