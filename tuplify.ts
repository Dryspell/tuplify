import { serializeToTuples, toJSON } from "./utils.ts";
import { Serializable, SerializableObject } from "./types.ts";

export default function tuplify<
  TRepresentativesDict extends Record<
    string,
    { type: string } & SerializableObject
  >,
>(representatives: TRepresentativesDict) {
  type TypedObject<Ttype extends string> = Ttype extends
    keyof TRepresentativesDict ? {
      type: Ttype;
    } & Omit<TRepresentativesDict[Ttype], "type">
    : never;

  function serializeWithType<Ttype extends keyof TRepresentativesDict & string>(
    target: TypedObject<Ttype>,
  ): [type: Ttype, ...Serializable[]] {
    const { type, ...data } = target;

    const representative = representatives[type];
    if (!representative || typeof representative !== "object") {
      throw new Error(`No representative found for type: ${type}`);
    }

    const { type: _rType, ...rData } = representative;
    return [
      type,
      ...serializeToTuples(
        rData,
        data,
      ) as Serializable[],
    ] as [
      Ttype,
      ...Serializable[],
    ];
  }

  function deserializationProxyWrapper<
    Ttype extends keyof TRepresentativesDict & string,
  >(
    serialized: [Ttype, ...Serializable[]],
  ): TypedObject<Ttype> {
    const [type, ...data] = serialized;

    const representative = representatives[type];
    if (!representative || typeof representative !== "object") {
      throw new Error(`No representative found for type: ${type}`);
    }

    function createProxy(
      rep: SerializableObject,
      data: Serializable[],
    ): SerializableObject {
      if (!rep || typeof rep !== "object") {
        throw new Error("Representative must be a non-null object.");
      }

      return new Proxy(
        {},
        {
          get(_, prop: string | symbol) {
            if (prop === "toJSON") {
              return () => toJSON(rep, data);
            }

            if (typeof prop !== "string") {
              throw new Error(`Unsupported property access: ${String(prop)}`);
            }
            const keys = Object.keys(rep);
            const index = keys.indexOf(prop);

            if (index === -1) {
              throw new Error(
                `Property "${prop}" does not exist in the representative.`,
              );
            }

            const repValue = rep[prop];
            const dataValue = Array.isArray(data) ? data[index] : undefined;

            // Recursively wrap nested objects
            if (repValue !== null && typeof repValue === "object") {
              if (!Array.isArray(dataValue)) {
                throw new Error(
                  `Expected array for nested data at property "${prop}".`,
                );
              }
              return createProxy(repValue as SerializableObject, dataValue);
            }

            return dataValue;
          },
          ownKeys() {
            return Reflect.ownKeys(rep);
          },
          getOwnPropertyDescriptor(_, prop: string | symbol) {
            if (prop in rep) {
              return {
                enumerable: true,
                configurable: true,
              };
            }
            return undefined;
          },
        },
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
