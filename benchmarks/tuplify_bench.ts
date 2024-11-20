import tuplify from "../tuplify.ts";
import { TypedSerialized } from "../types.ts";

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
	},
	product: {
		type: "product" as const,
		title: "",
		price: 0,
		categories: [] as string[],
	},
};

const [serializeWithType, deserializationProxyWrapper] =
	tuplify(representatives);

// Sample data for benchmarks
const sampleUser = {
	type: "user" as const,
	name: "John Doe",
	age: 30,
	address: {
		street: "123 Main St",
		city: "Boston",
		zip: 12345,
	},
};

const sampleProduct = {
	type: "product" as const,
	title: "Cool Gadget",
	price: 99.99,
	categories: ["electronics", "gadgets"],
};

// User serialization comparison
Deno.bench(
	"JSON.stringify user",
	{
		group: "user serialization",
		baseline: true,
	},
	() => {
		JSON.stringify(sampleUser);
	}
);

Deno.bench(
	"tuplify serialize user",
	{
		group: "user serialization",
	},
	() => {
		JSON.stringify(serializeWithType(sampleUser));
	}
);

// Product serialization comparison
Deno.bench(
	"JSON.stringify product",
	{
		group: "product serialization",
		baseline: true,
	},
	() => {
		JSON.stringify(sampleProduct);
	}
);

Deno.bench(
	"tuplify serialize product",
	{
		group: "product serialization",
	},
	() => {
		JSON.stringify(serializeWithType(sampleProduct));
	}
);

// Prepare serialized data for deserialization benchmarks
const serializedUser = JSON.stringify(serializeWithType(sampleUser));
// [
// 	"user",
// 	"John Doe",
// 	30,
// 	["123 Main St", "Boston", 12345],
// ] as TypedSerialized<"user">;

const serializedProduct = JSON.stringify(serializeWithType(sampleProduct));
// [
// 	"product",
// 	"Cool Gadget",
// 	99.99,
// 	["electronics", "gadgets"],
// ] as TypedSerialized<"product">;

const jsonUser = JSON.stringify(sampleUser);
const jsonProduct = JSON.stringify(sampleProduct);

// User deserialization comparison
Deno.bench(
	"JSON.parse user",
	{
		group: "user deserialization",
		baseline: true,
	},
	() => {
		JSON.parse(jsonUser);
	}
);

Deno.bench(
	"tuplify deserialize user",
	{
		group: "user deserialization",
	},
	() => {
		deserializationProxyWrapper(JSON.parse(serializedUser));
	}
);

// Product deserialization comparison
Deno.bench(
	"JSON.parse product",
	{
		group: "product deserialization",
		baseline: true,
	},
	() => {
		JSON.parse(jsonProduct);
	}
);

Deno.bench(
	"tuplify deserialize product",
	{
		group: "product deserialization",
	},
	() => {
		deserializationProxyWrapper(JSON.parse(serializedProduct));
	}
);

// Prepare deserialized data for access benchmarks
const parsedUser = JSON.parse(jsonUser);
const tuplifiedUser = deserializationProxyWrapper<"user">(
	JSON.parse(serializedUser)
);
const parsedProduct = JSON.parse(jsonProduct);
const tuplifiedProduct = deserializationProxyWrapper<"product">(
	JSON.parse(serializedProduct)
);

// User property access comparison - shallow
Deno.bench(
	"JSON parsed user shallow access",
	{ group: "user property access shallow", baseline: true },
	() => {
		const _name = parsedUser.name;
		const _type = parsedUser.type;
	}
);

Deno.bench(
	"tuplify user shallow access",
	{ group: "user property access shallow" },
	() => {
		const _name = tuplifiedUser.name;
		const _type = tuplifiedUser.type;
	}
);

// User property access comparison - deep
Deno.bench(
	"JSON parsed user deep access",
	{ group: "user property access deep", baseline: true },
	() => {
		const _street = parsedUser.address.street;
		const _zip = parsedUser.address.zip;
	}
);

Deno.bench(
	"tuplify user deep access",
	{ group: "user property access deep" },
	() => {
		const _street = tuplifiedUser.address.street;
		const _zip = tuplifiedUser.address.zip;
	}
);

// Product property access comparison - shallow
Deno.bench(
	"JSON parsed product shallow access",
	{ group: "product property access shallow", baseline: true },
	() => {
		const _title = parsedProduct.title;
		const _price = parsedProduct.price;
	}
);

Deno.bench(
	"tuplify product shallow access",
	{ group: "product property access shallow" },
	() => {
		const _title = tuplifiedProduct.title;
		const _price = tuplifiedProduct.price;
	}
);

// Product property access comparison - deep/array
Deno.bench(
	"JSON parsed product array access",
	{ group: "product property access array", baseline: true },
	() => {
		const _firstCategory = parsedProduct.categories[0];
		const _categoryCount = parsedProduct.categories.length;
	}
);

Deno.bench(
	"tuplify product array access",
	{ group: "product property access array" },
	() => {
		const _firstCategory = tuplifiedProduct.categories[0];
		const _categoryCount = tuplifiedProduct.categories.length;
	}
);

// Data size comparison using POST request body encoding
const encoder = new TextEncoder();
const userSize = encoder.encode(jsonUser).length;
const serializedUserSize = encoder.encode(
	JSON.stringify(serializedUser)
).length;
const productSize = encoder.encode(jsonProduct).length;
const serializedProductSize = encoder.encode(
	JSON.stringify(serializedProduct)
).length;

console.log("\nData size comparison (in bytes):");
console.log("User:");
console.log(`  Original: ${userSize}`);
console.log(`  Serialized: ${serializedUserSize}`);
console.log(
	`  Reduction: ${Math.round((1 - serializedUserSize / userSize) * 100)}%`
);

console.log("\nProduct:");
console.log(`  Original: ${productSize}`);
console.log(`  Serialized: ${serializedProductSize}`);
console.log(
	`  Reduction: ${Math.round(
		(1 - serializedProductSize / productSize) * 100
	)}%`
);
