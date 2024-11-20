import tuplify from "../tuplify.ts";

// Representative structure for our large JSON payloads
const representatives = {
	analytics: {
		type: "analytics" as const,
		timestamp: 0,
		events: [
			{
				eventId: "",
				data: [0],
				metadata: {
					tags: [""],
					location: [0, 0],
				},
			},
		],
		summary: {
			totalEvents: 0,
			categories: [""],
			metrics: {
				daily: [0],
				weekly: [0],
				monthly: [0],
			},
		},
	},
};

const [serializeWithType, deserializationProxyWrapper] =
	tuplify(representatives);

// Generate large sample data
function generateSampleData(eventCount: number) {
	return {
		type: "analytics" as const,
		timestamp: Date.now(),
		events: Array.from({ length: eventCount }, (_, i) => ({
			eventId: `evt_${i}`,
			data: Array.from({ length: 100 }, () => Math.random() * 1000),
			metadata: {
				tags: Array.from({ length: 5 }, (_, i) => `tag_${i}`),
				location: [
					Math.random() * 180 - 90,
					Math.random() * 360 - 180,
				] as [number, number],
			},
		})),
		summary: {
			totalEvents: eventCount,
			categories: Array.from({ length: 20 }, (_, i) => `category_${i}`),
			metrics: {
				daily: Array.from({ length: 30 }, () => Math.random() * 1000),
				weekly: Array.from({ length: 52 }, () => Math.random() * 5000),
				monthly: Array.from(
					{ length: 12 },
					() => Math.random() * 20000
				),
			},
		},
	};
}

// Create sample data with different sizes
const smallPayload = generateSampleData(10);
const mediumPayload = generateSampleData(100);
const largePayload = generateSampleData(1000);

// Prepare JSON strings for parsing benchmarks
const jsonSmall = JSON.stringify(smallPayload);
const jsonMedium = JSON.stringify(mediumPayload);
const jsonLarge = JSON.stringify(largePayload);

// Prepare serialized data for deserialize benchmarks
const serializedSmall = JSON.stringify(serializeWithType(smallPayload));
const serializedMedium = JSON.stringify(serializeWithType(mediumPayload));
const serializedLarge = JSON.stringify(serializeWithType(largePayload));

console.log(serializeWithType(smallPayload), smallPayload);

// Prepare deserialized data for access benchmarks
const parsedLarge = JSON.parse(jsonLarge);
const tuplifiedLarge = deserializationProxyWrapper(
	serializeWithType(largePayload)
);

// Property access benchmarks - shallow
Deno.bench(
	"JSON parsed shallow access",
	{ group: "property access shallow", baseline: true },
	() => {
		const _type = parsedLarge.type;
		const _timestamp = parsedLarge.timestamp;
		const _totalEvents = parsedLarge.summary.totalEvents;
	}
);

Deno.bench(
	"tuplify shallow access",
	{ group: "property access shallow" },
	() => {
		const _type = tuplifiedLarge.type;
		const _timestamp = tuplifiedLarge.timestamp;
		const _totalEvents = tuplifiedLarge.summary.totalEvents;
	}
);

// Property access benchmarks - deep array access
Deno.bench(
	"JSON parsed deep array access",
	{ group: "property access deep array", baseline: true },
	() => {
		const _firstEventId = parsedLarge.events[0].eventId;
		const _firstEventData = parsedLarge.events[0].data[0];
		const _firstEventLocation = parsedLarge.events[0].metadata.location[0];
		const _firstDailyMetric = parsedLarge.summary.metrics.daily[0];
	}
);

Deno.bench(
	"tuplify deep array access",
	{ group: "property access deep array" },
	() => {
		const _firstEventId = tuplifiedLarge.events[0].eventId;
		const _firstEventData = tuplifiedLarge.events[0].data[0];
		const _firstEventLocation =
			tuplifiedLarge.events[0].metadata.location[0];
		const _firstDailyMetric = tuplifiedLarge.summary.metrics.daily[0];
	}
);

// Property access benchmarks - array iteration
Deno.bench(
	"JSON parsed array iteration",
	{ group: "property access array iteration", baseline: true },
	() => {
		let _sum = 0;
		for (const event of parsedLarge.events) {
			_sum += event.data[0];
		}
		for (const daily of parsedLarge.summary.metrics.daily) {
			_sum += daily;
		}
	}
);

Deno.bench(
	"tuplify array iteration",
	{ group: "property access array iteration" },
	() => {
		let _sum = 0;
		for (const event of tuplifiedLarge.events) {
			_sum += event.data[0];
		}
		for (const daily of tuplifiedLarge.summary.metrics.daily) {
			_sum += daily;
		}
	}
);

// Benchmarks for different payload sizes
(["small", "medium", "large"] as const).forEach((size) => {
	const payload = {
		small: smallPayload,
		medium: mediumPayload,
		large: largePayload,
	}[size];

	const jsonStr = {
		small: jsonSmall,
		medium: jsonMedium,
		large: jsonLarge,
	}[size];

	const serialized = {
		small: serializedSmall,
		medium: serializedMedium,
		large: serializedLarge,
	}[size];

	// Serialization benchmarks
	Deno.bench(
		`JSON.stringify ${size} payload`,
		{ group: `${size} serialization`, baseline: true },
		() => {
			JSON.stringify(payload);
		}
	);

	Deno.bench(
		`tuplify serialize ${size} payload`,
		{ group: `${size} serialization` },
		() => {
			JSON.stringify(serializeWithType(payload));
		}
	);

	// Deserialization benchmarks
	Deno.bench(
		`JSON.parse ${size} payload`,
		{ group: `${size} deserialization`, baseline: true },
		() => {
			JSON.parse(jsonStr);
		}
	);

	Deno.bench(
		`tuplify deserialize ${size} payload`,
		{ group: `${size} deserialization` },
		() => {
			deserializationProxyWrapper(JSON.parse(serialized));
		}
	);
});

// Size comparison
const encoder = new TextEncoder();
["small", "medium", "large"].forEach((size) => {
	const jsonStr = {
		small: jsonSmall,
		medium: jsonMedium,
		large: jsonLarge,
	}[size];

	const serialized = {
		small: serializedSmall,
		medium: serializedMedium,
		large: serializedLarge,
	}[size];

	const jsonSize = encoder.encode(jsonStr).length;
	const serializedSize = encoder.encode(JSON.stringify(serialized)).length;
	const reduction = Math.round((1 - serializedSize / jsonSize) * 100);

	console.log(
		`\n${
			size.charAt(0).toUpperCase() + size.slice(1)
		} payload size comparison (in bytes):`
	);
	console.log(`  Original: ${jsonSize}`);
	console.log(`  Serialized: ${serializedSize}`);
	console.log(`  Reduction: ${reduction}%`);
});