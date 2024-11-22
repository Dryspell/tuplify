import { assertEquals, assertThrows } from "jsr:@std/assert";
import { toJSON } from "../core.ts";
import { Serialized } from "../types.ts";

Deno.test("toJSON - primitive values", () => {
	assertEquals(toJSON("string", "test"), "test");
	assertEquals(toJSON(123, 456), 456);
	assertEquals(toJSON(true, false), false);
	assertEquals(toJSON(null, null), null);
});

Deno.test("toJSON - throws on primitive rep with non-primitive data", () => {
	assertThrows(
		() => toJSON(123, ["not", "a", "number"]),
		Error,
		"Expected non-primitive value"
	);
});

Deno.test("toJSON - simple array", () => {
	const rep = [""];
	const data = ["one", "two", "three"] as Serialized;
	const expected = ["one", "two", "three"];
	assertEquals(toJSON(rep, data), expected);
});

Deno.test("toJSON - simple object", () => {
	const rep = { name: "", age: 0 };
	const data = ["John", 30] as [string, number];
	const expected = { name: "John", age: 30 };
	assertEquals(toJSON(rep, data), expected);
});

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

Deno.test("toJSON - array of objects", () => {
	const rep = [
		{
			id: 0,
			name: "",
		},
	];
	const data = [
		[1, "first"],
		[2, "second"],
	] as Serialized;
	const expected = [
		{ id: 1, name: "first" },
		{ id: 2, name: "second" },
	];
	assertEquals(toJSON(rep, data), expected);
});

// Deno.test("toJSON - handles null values", () => {
// 	const rep = { name: "", age: 0 };
// 	const data = ["John", null] as Serialized;
// 	const expected = { name: "John", age: null };
// 	assertEquals(toJSON(rep, data), expected);
// });
