// deno run -A build_npm.ts 0.1.0
import { build, emptyDir } from "@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./tuplify.ts", "./types.ts", "./core.ts"],
  typeCheck: "both",
  filterDiagnostic(diagnostic) {
    if (
      diagnostic.file?.fileName.includes("jsr.io/@std/assert")
    ) {
      return false; // ignore all diagnostics in this file
    }
    // etc... more checks here
    return true;
  },
  compilerOptions: {
    importHelpers: true,
  },
  outDir: "./npm",
  shims: {
    deno: true,
  },
  package: {
    name: "tuplify",
    version: Deno.args[0],
    description:
      "Serialization and deserialization of objects to nested tuples based on a representative object.",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/Dryspell/tuplify.git",
    },
    bugs: {
      url: "https://github.com/Dryspell/tuplify/issues",
    },
    author: "Dryspell",
    keywords: [
      "serialization",
      "deserialization",
      "tuples",
      "objects",
      "tabular",
    ],
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
