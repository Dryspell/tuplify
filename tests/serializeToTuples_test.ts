import { assertEquals, assertThrows } from "jsr:@std/assert";
import { serializeToTuples } from "../core.ts";
import { SerializedTuple } from "../types.ts";

Deno.test("serializeToTuples - primitives", () => {
	assertEquals(serializeToTuples(42), 42);
	assertEquals(serializeToTuples("hello"), "hello");
	assertEquals(serializeToTuples(true), true);
	assertEquals(serializeToTuples(null), null);
	assertEquals(serializeToTuples(undefined), undefined);
});

Deno.test("serializeToTuples - simple object", () => {
	const input = { name: "John", age: 30 };
	const expected = ["John", 30] as SerializedTuple;
	assertEquals(serializeToTuples(input), expected);
});

Deno.test("serializeToTuples - nested object", () => {
	const input = {
		user: {
			name: "John",
			details: {
				age: 30,
				active: true,
			},
		},
	};
	const expected = [["John", [30, true]]] as SerializedTuple;
	assertEquals(serializeToTuples(input), expected);
});

Deno.test("serializeToTuples - arrays", () => {
	const input = ["a", "b", "c"];
	const expected = ["a", "b", "c"] as SerializedTuple;
	assertEquals(serializeToTuples(input), expected);
});

// Mixed arrays are not supported by this function, they must have uniform type structure
Deno.test("serializeToTuples - mixed array", () => {
	const input = ["a", { x: 1, y: 2 }, ["b", "c"]];
	assertThrows(() => serializeToTuples(input));
});

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

Deno.test("serializeToTuples - empty structures", () => {
	assertEquals(serializeToTuples([]), []);
	assertEquals(serializeToTuples({}), []);
	assertEquals(serializeToTuples([{}]), [[]]);
});
