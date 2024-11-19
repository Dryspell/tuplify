import tuplify from "../tuplify.ts";
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

const [serializeWithType, deserializationProxyWrapper] = tuplify(
  representatives,
);
