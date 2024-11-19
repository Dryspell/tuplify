import { isPrimitive, Serializable, SerializableObject } from "./types.ts";

export function serializeToTuples<TRep extends Serializable>(
  rep: TRep,
  obj: Serializable,
): Serializable {
  if (isPrimitive(obj)) {
    return obj;
  }

  if (Array.isArray(rep) && Array.isArray(obj)) {
    // Recursively handle arrays
    return obj.map((item) => serializeToTuples(rep[0], item));
  }

  if (
    rep && typeof rep === "object" && !Array.isArray(obj) &&
    !Array.isArray(rep)
  ) {
    // Recursively handle objects
    return Object.entries(obj).map(([key, value]) => {
      const repValue = rep[key];
      const objValue = obj[key];
      return repValue !== null && typeof repValue === "object"
        ? serializeToTuples(repValue, objValue ?? {})
        : (objValue ?? null);
    });
  }

  throw new Error(`Invalid structure encountered during serialization.`);
}

export const toJSON = (rep: SerializableObject, data: Serializable[]) => {
  const result: Record<string, unknown> = {};
  Object.keys(rep).forEach((key, index) => {
    const repValue = rep[key];
    const dataValue = data[index];

    result[key] = repValue !== null && typeof repValue === "object"
      ? toJSON(repValue as SerializableObject, dataValue as Serializable[])
      : dataValue;
  });
  return result;
};
