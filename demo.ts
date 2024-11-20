import tuplify from "./tuplify.ts";

const representatives = {
	user: {
		type: "user",
		name: "",
		age: 0,
		address: {
			street: "",
			city: "",
			zip: 0,
		},
		hobbies: [{ name: "", frequency: "" }],
	},
};

const [serializeWithType, deserializationProxyWrapper] =
	tuplify(representatives);

const user = {
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
console.log(user);

const serializedUser = serializeWithType(user);
console.log(serializedUser);

const deserializedUser = deserializationProxyWrapper(serializedUser);
console.log(deserializedUser);
console.log(deserializedUser.hobbies);
console.log([...deserializedUser.hobbies]);
console.log(deserializedUser.hobbies.length);
console.log(deserializedUser.hobbies[0].name); // Output: "Cycling"
console.log(deserializedUser.hobbies[1].frequency); // Output: "Monthly"
