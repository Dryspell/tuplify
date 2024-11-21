# Tuplify

- [Tuplify](#tuplify)
  - [Overview](#overview)
  - [Features](#features)
  - [Usage](#usage)
    - [Serialization](#serialization)
    - [Deserialization](#deserialization)
    - [Just the Essentials](#just-the-essentials)
    - [Benchmarks](#benchmarks)
  - [Contributing](#contributing)
  - [License](#license)

## Overview

Tuplify is a ECMAScript / TypeScript library designed to serialize arbitrary ECMAScript objects with the mindset that `if my server and client both agree on a schema, then I shouldn't have to send all the keys with every request`. As such, Tuplify serializes objects into a series of nested tuples that omit the keys of the original object. This approach aims to optimize data storage and transmission by reducing the size of serialized data by the ratio of the length of the keys to the length of the values. For example:

```json
{
 "type": "user",
 "name": "Alice",
 "age": 25,
 "address": { "street": "456 Elm St", "city": "Metropolis", "zip": 54321 },
 "hobbies": [
  { "name": "Cycling", "frequency": "Weekly" },
  { "name": "Chess", "frequency": "Monthly" }
 ]
}
```

gets serialized to:

```json
[
 "user",
 "Alice",
 25,
 ["456 Elm St", "Metropolis", 54321],
 [
  ["Cycling", "Weekly"],
  ["Chess", "Monthly"]
 ]
]
```

for a reduction of about **40%** of the size of the original object.

In deserialization, Tuplify maintains the ability to easily reconstruct the original objects (through simple `JSON.parse(JSON.stringify(DESERIALIZED_OBJECT))`) or alternatively provide a proxy wrapper that provides the DX of traditional JavaScript objects while keeping the structure of the underlying data as a tuple.

Note that the trade-off that we make is between serialization/deserialization speed and the size of the serialized object which is a trade-off that must be made for any serialization library, and results in data that is similar in structure to any other tabular data format (e.g. CSV, Parquet, SQL,etc.).

## Features

- **Serialization to Tuples**: Convert objects into a compact tuple format, which can be more efficient for storage and transmission.
- **Deserialization with Proxies**: Reconstruct objects from tuples using JavaScript Proxies, allowing for lazy evaluation and efficient access patterns.
- **Type Safety**: Leverage TypeScript's type system to ensure type safety during serialization and deserialization processes.
- **Benchmarking**: Includes benchmarks to compare the performance of Tuplify against native JSON serialization/deserialization.

## Usage

_Refer to the [demo.ts](demo.ts) file for a complete example of everything discussed below._

To start, your client and server must agree on a representative structure. This is an object that contains all the possible types of objects that will be serialized and deserialized. For example:

```typescript
const representatives = {
 user: {
  type: "user" as const,
  name: "",
  age: 0,
  address: {
   street: "",
   city: "",
   zip: 0,
  },
  hobbies: [{ name: "", frequency: "" }],
 },
 product: {
  type: "product" as const,
  title: "",
  price: 0,
  categories: ["hello"],
 },
};
```

Note that the `type` field is required for every object in the representative structure and this `type` field must match the key in the `representatives` object. Further, every field in the object must be present in the representative structure. This object should be statically defined for your application and acts as a schema for your communication protocol shared between the client and server.

Given this representative structure, you can then generate a serialization and deserialization functions:

```typescript
const [serializeWithType, deserializationProxyWrapper] =
 tuplify(representatives);
```

Suppose we have the following object that we wish to serialize:

```typescript
const sampleUser = {
 type: "user" as const,
 name: "Alice",
 age: 25,
 address: {
  street: "456 Elm St",
  city: "Metropolis",
  zip: 54321,
 },
 hobbies: [
  { name: "Cycling", frequency: "Weekly" },
  { name: "Chess", frequency: "Monthly" },
 ],
};
```

### Serialization

To serialize an object, use the `serializeWithType` function. Using the `sampleUser` object defined above, we can serialize it as follows:

```typescript
const serializedUser = serializeWithType(sampleUser);
```

If you inspect the `serializedUser`, you will see that it is a tuple of tuples.

```typescript
console.log(serializedUser);
```

yields

```json
[
  "user",
  "Alice",
  25,
  [ "456 Elm St", "Metropolis", 54321 ],
  [ [ "Cycling", "Weekly" ], [ "Chess", "Monthly" ] ]  
]
```

If your framework of choice (websockets, http, etc.) does not support tuples or JSON or does not automatically stringify before transmission, you can convert the tuple to a JSON string using `JSON.stringify` before transmitting it over the network. If you look over the benchmarks, you can see that this extra step of serialization compared to `JSON.stringify` is relatively negligible amounting to about 5-30% overhead, depending on the structure of the original object. That is, `JSON.stringify` alone is faster than ripping out the keys while preserving the structure and then stringifying it but for objects like this one, we're talking about 100µs vs 120µs.

Worry not about the order of the entries before serialization. Tuplify will always serialize objects in the same order indicated by the representative structure.

**Note:** The serialized user is typed as a `TypedSerialized<"user">` which looks like: `["user", ......(Primitive | Serialized)[]]` where `Primitive` is `string | number | boolean | null | undefined` and `Serialized` is another tuple of tuples. It is in theory possible to get even more type safety to yield the exact types of the entries of the serialized object but to the best of the author's knowledge, going any deeper than this is not possible due to limitations of the TypeScript compiler being unable to ensure the ordering of the inferred types. If you are interested in pursuing this further, please open an issue and the author will be happy to review a PR or discuss previous attempts at a solution. In an ideal world, we would not only be able to get the types of the entries but also generically assign the keys to the tuple as a [labeled tuple](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#labeled-tuple-elements) like `type User = [firstName: string, lastName: string];` but this is not currently possible.

### Deserialization

To deserialize a tuple back into an object, use the `deserializationProxyWrapper` function. This function returns a Proxy-wrapped object that behaves like the original object.

```typescript
const deserializedUser = deserializationProxyWrapper(serializedUser);
```

With the deserialized object, you can access the properties just like you would with a normal object.

```typescript
console.log(deserializedUser); // Output:
{
  type: "user",
  name: "Alice",
  age: 25,
  address: Object { street: "456 Elm St", city: "Metropolis", zip: 54321 },  hobbies: [
    Object { name: "Cycling", frequency: "Weekly" },
    Object { name: "Chess", frequency: "Monthly" }
  ]
}
```

```typescript
console.log(deserializedUser.hobbies); // Output:
[
  Object { name: "Cycling", frequency: "Weekly" },
  Object { name: "Chess", frequency: "Monthly" }
];
```

```typescript
console.log([...deserializedUser.hobbies]); // Output:
[
  Object { name: "Cycling", frequency: "Weekly" },
  Object { name: "Chess", frequency: "Monthly" }
];
```

```typescript
console.log(deserializedUser.hobbies.length); // Output: 2
console.log(deserializedUser.hobbies[0].name); // Output: "Cycling"
console.log(deserializedUser.hobbies[1].frequency); // Output: "Monthly"
```

```typescript
console.log(Object.entries(deserializedUser)); // Output:
[
 ["type", "user"],
 ["name", "Alice"],
 ["age", 25],
 ["address", { street: "456 Elm St", city: "Metropolis", zip: 54321 }],
 [
  "hobbies",
  [
   { name: "Cycling", frequency: "Weekly" },
   { name: "Chess", frequency: "Monthly" },
  ],
 ],
]
```

If you wish to yield the original object without the proxy, you can do so by simply calling `JSON.parse(JSON.stringify(deserializedUser))`.

```typescript
console.log(JSON.parse(JSON.stringify(deserializedUser))); // Output:
{
  type: "user",
  name: "Alice",
  age: 25,
  address: { street: "456 Elm St", city: "Metropolis", zip: 54321 },
  hobbies: [
    { name: "Cycling", frequency: "Weekly" },
    { name: "Chess", frequency: "Monthly" }
  ]
};
```

Doing so, you don't have to pay the overhead of the proxy wrapper for any future property access but you have to pay additional upfront cost of the `JSON.parse(JSON.stringify(...))` operation.

We even get deep equality checking!

```typescript
// Source Code for Deno assertEqual - https://jsr.io/@std/assert/1.0.8/equals.ts
console.log(equal(deserializedUser, sampleUser)); // Output: true
```

### Just the Essentials

If you are only interested in the serialization and deserialization of objects via this tuplified format, you can use the core `serializeToTuples` and `toJSON` functions directly.

```typescript
Deno.test("serializeToTuples - complex nested structure", () => {
 const input = {
  data: {
   users: [
    { name: "John", scores: [10, 20] },
    { name: "Jane", scores: [15, 25] },
   ],
  },
 };
 const expected = [
  [
   [
    ["John", [10, 20]],
    ["Jane", [15, 25]],
   ],
  ],
 ] as SerializedTuple;
 assertEquals(serializeToTuples(input), expected);
});
```

```typescript
Deno.test("toJSON - nested object", () => {
 const rep = {
  user: {
   name: "",
   details: {
    age: 0,
    active: false,
   },
  },
 };
 const data = [["Alice", [25, true]]] as Serialized;
 const expected = {
  user: {
   name: "Alice",
   details: {
    age: 25,
    active: true,
   },
  },
 };
 assertEquals(toJSON(rep, data), expected);
});
```

Doing so, you can use the library without as much of the organizational overhead (and some computational) but you may lose some of the additional safety and convenience features of the wrapper functions.

See the [tests](tests) folder for more examples.

### Benchmarks

The project includes benchmarks to evaluate the performance of Tuplify compared to native JSON methods. These benchmarks measure serialization, deserialization, and property access times.

Clone the repo and run `deno bench benchmarks/` to see the benchmarks.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to discuss potential improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
