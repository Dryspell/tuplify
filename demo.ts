import tuplify from "./tuplify.ts";
import { equal } from "./equal.ts";

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
  product: {
    type: "product",
    title: "",
    price: 0,
    categories: ["hello"],
  },
};

const {
  ser: serializeWithType,
  deserProxy: deserializationProxyWrapper,
  deserJson: deserializeToJSON,
} = tuplify(representatives);

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
console.log(sampleUser);

const serializedUser = serializeWithType(sampleUser);
console.log(serializedUser);

console.log(deserializeToJSON(serializedUser));

const deserializedUser = deserializationProxyWrapper(serializedUser);

console.log(deserializedUser); // Output:
// {
//   type: "user",
//   name: "Alice",
//   age: 25,
//   address: Object { street: "456 Elm St", city: "Metropolis", zip: 54321 },  hobbies: [
//     Object { name: "Cycling", frequency: "Weekly" },
//     Object { name: "Chess", frequency: "Monthly" }
//   ]
// }

console.log(deserializedUser.hobbies); // Output:
// [
//   Object { name: "Cycling", frequency: "Weekly" },
//   Object { name: "Chess", frequency: "Monthly" }
// ]

console.log([...deserializedUser.hobbies]); // Output:
// [
//   Object { name: "Cycling", frequency: "Weekly" },
//   Object { name: "Chess", frequency: "Monthly" }
// ]
console.log(deserializedUser.hobbies.length); // Output: 2
console.log(deserializedUser.hobbies[0].name); // Output: "Cycling"
console.log(deserializedUser.hobbies[1].frequency); // Output: "Monthly"

console.log(JSON.parse(JSON.stringify(deserializedUser))); // Output:
// {
//   type: "user",
//   name: "Alice",
//   age: 25,
//   address: { street: "456 Elm St", city: "Metropolis", zip: 54321 },
//   hobbies: [
//     { name: "Cycling", frequency: "Weekly" },
//     { name: "Chess", frequency: "Monthly" }
//   ]
// }

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
];

// https://jsr.io/@std/assert/1.0.8/equals.ts
console.log(equal(deserializedUser, sampleUser)); // Output: true

console.log(String(deserializedUser)); // Output:
