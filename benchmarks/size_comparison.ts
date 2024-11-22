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

const {
  ser,
} = tuplify(representatives);

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
          () => Math.random() * 20000,
        ),
      },
    },
  };
}

// Create sample data with different sizes
const smallPayload = Array.from({ length: 10 }, () => generateSampleData(10));
const mediumPayload = Array.from({ length: 10 }, () => generateSampleData(100));
const largePayload = Array.from({ length: 10 }, () => generateSampleData(1000));

// Prepare JSON strings for parsing benchmarks
const jsonSmall = JSON.stringify(smallPayload);
const jsonMedium = JSON.stringify(mediumPayload);
const jsonLarge = JSON.stringify(largePayload);

// Prepare serialized data for deserialize benchmarks
const serializedSmall = JSON.stringify(
  smallPayload.map((payload) => ser(payload)),
);
const serializedMedium = JSON.stringify(
  mediumPayload.map((payload) => ser(payload)),
);
const serializedLarge = JSON.stringify(
  largePayload.map((payload) => ser(payload)),
);

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
    } payload size comparison (in bytes):`,
  );
  console.log(`  Original: ${jsonSize}`);
  console.log(`  Serialized: ${serializedSize}`);
  console.log(`  Reduction: ${reduction}%`);
});
