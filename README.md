# Tuplify

## Overview

Tuplify is a TypeScript library designed to serialize and deserialize complex JavaScript objects into a tuple-based format. This approach aims to optimize data storage and transmission by reducing the size of serialized data, while maintaining the ability to easily reconstruct the original objects.

## Features

-   **Serialization to Tuples**: Convert objects into a compact tuple format, which can be more efficient for storage and transmission.
-   **Deserialization with Proxies**: Reconstruct objects from tuples using JavaScript Proxies, allowing for lazy evaluation and efficient access patterns.
-   **Type Safety**: Leverage TypeScript's type system to ensure type safety during serialization and deserialization processes.
-   **Benchmarking**: Includes benchmarks to compare the performance of Tuplify against native JSON serialization/deserialization.

## Usage

### Serialization

To serialize an object, use the `serializeWithType` function. This function takes an object that matches a predefined representative structure and returns a tuple representation.

```typescript
const [serializeWithType, deserializationProxyWrapper] =
	tuplify(representatives);
const serializedUser = serializeWithType(sampleUser);
```

### Deserialization

To deserialize a tuple back into an object, use the `deserializationProxyWrapper` function. This function returns a Proxy-wrapped object that behaves like the original object.

```typescript
const deserializedUser = deserializationProxyWrapper(serializedUser);
```

### Benchmarks

The project includes benchmarks to evaluate the performance of Tuplify compared to native JSON methods. These benchmarks measure serialization, deserialization, and property access times.

```typescript
Deno.bench("tuplify serialize user", () => {
	JSON.stringify(serializeWithType(sampleUser));
});
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue to discuss potential improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
