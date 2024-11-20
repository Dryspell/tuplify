import { assertEquals, assertThrows } from "jsr:@std/assert";
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
		categories: ["hello"] as string[],
	},
};

const [serializeWithType, deserializationProxyWrapper] =
	tuplify(representatives);

Deno.test("serializeWithType should correctly serialize a user", () => {
	const user = {
		type: "user" as const,
		name: "John Doe",
		age: 30,
		address: {
			street: "123 Main St",
			city: "Boston",
			zip: 12345,
		},
	};

	const serialized = serializeWithType(user);
	assertEquals(serialized, [
		"user",
		"John Doe",
		30,
		["123 Main St", "Boston", 12345],
	]);
});

Deno.test(
	"serializeWithType should correctly serialize a user independently of the order of the fields",
	() => {
		const user = {
			name: "John Doe",
			type: "user" as const,
			address: {
				street: "123 Main St",
				city: "Boston",
				zip: 12345,
			},
			age: 30,
		};

		const serialized = serializeWithType(user);
		assertEquals(serialized, [
			"user",
			"John Doe",
			30,
			["123 Main St", "Boston", 12345],
		]);
	}
);

Deno.test("serializeWithType should correctly serialize a product", () => {
	const product = {
		type: "product" as const,
		title: "Cool Gadget",
		price: 99.99,
		categories: ["electronics", "gadgets"],
	};

	const serialized = serializeWithType(product);
	assertEquals(serialized, [
		"product",
		"Cool Gadget",
		99.99,
		["electronics", "gadgets"],
	]);
});

Deno.test(
	"deserializationProxyWrapper should correctly deserialize a user",
	() => {
		const serializedUser = [
			"user" as const,
			"John Doe",
			30,
			["123 Main St", "Boston", 12345],
		] as ["user", string, number, [string, string, number]];
		const deserialized = deserializationProxyWrapper(serializedUser);

		assertEquals(
			JSON.stringify(deserialized),
			JSON.stringify({
				type: "user",
				name: "John Doe",
				age: 30,
				address: {
					street: "123 Main St",
					city: "Boston",
					zip: 12345,
				},
			})
		);
	}
);

Deno.test(
	"deserializationProxyWrapper should correctly deserialize a product",
	() => {
		const product = {
			type: "product" as const,
			title: "Cool Gadget",
			price: 99.99,
			categories: ["electronics", "gadgets"],
		};

		const serialized = serializeWithType(product);
		const deserialized = deserializationProxyWrapper(serialized);

		assertEquals(
			JSON.stringify(deserialized),
			JSON.stringify({
				type: "product",
				title: "Cool Gadget",
				price: 99.99,
				categories: ["electronics", "gadgets"],
			})
		);
	}
);

Deno.test(
	"deserializationProxyWrapper should throw error for invalid type",
	() => {
		const invalidData = ["invalid", "data"] as ["invalid", string];
		// @ts-expect-error This is expected to throw an error
		assertThrows(() => deserializationProxyWrapper(invalidData), Error);
	}
);

Deno.test(
	"deserializationProxyWrapper should throw error for malformed data",
	() => {
		const malformedUser = ["user", "John Doe"] as ["user", string]; // missing required fields
		assertThrows(() => deserializationProxyWrapper(malformedUser), Error);
	}
);

Deno.test("deserialized user should allow reading properties", () => {
	const serializedUser = [
		"user" as const,
		"John Doe",
		30,
		["123 Main St", "Boston", 12345],
	] as ["user", string, number, [string, string, number]];
	const deserialized = deserializationProxyWrapper(serializedUser);

	assertEquals(deserialized.type, "user");
	assertEquals(deserialized.name, "John Doe");
	assertEquals(deserialized.age, 30);
	assertEquals(deserialized.address.street, "123 Main St");
	assertEquals(deserialized.address.city, "Boston");
	assertEquals(deserialized.address.zip, 12345);
});

Deno.test("deserialized product should allow reading properties", () => {
	const serializedProduct = [
		"product" as const,
		"Cool Gadget",
		99.99,
		["electronics", "gadgets"],
	] as TypedSerialized<"product">;
	const deserialized = deserializationProxyWrapper(serializedProduct);

	assertEquals(deserialized.type, "product");
	assertEquals(deserialized.title, "Cool Gadget");
	assertEquals(deserialized.price, 99.99);
	assertEquals(deserialized.categories, ["electronics", "gadgets"]);
});

Deno.test("deserialized objects should be immutable", () => {
	const serializedUser = [
		"user" as const,
		"John Doe",
		30,
		["123 Main St", "Boston", 12345],
	] as ["user", string, number, [string, string, number]];
	const deserialized = deserializationProxyWrapper(serializedUser);

	assertThrows(
		() => {
			deserialized.address.city = "New York";
		},
		TypeError,
		"Cannot redefine"
	);
});
