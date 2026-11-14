// Build-time helper: pull a sample of real radiation readings from NASA's
// RadLab data API and print the average absorbed dose rate (uGy/hour) and
// dose equivalent rate (uSv/hour). The team copies these real averages into
// src/data/constants.ts and removes the `unverified: true` flags.
//
// Run with:  node --experimental-strip-types scripts/sample-radlab.ts
//
// Real API shape (confirmed against the live service):
//   GET https://visualization.osdr.nasa.gov/radlab/api/
//       ?query=<filter expression>
//       &columns=absorbed_dose_rate,dose_equivalent_rate
//       &format=json
//   Response is a pandas-style table:
//       { "columns": ["timestamp","instrument_id","absorbed_dose_rate",
//                      "dose_equivalent_rate"],
//         "data": [ [ ...row... ], ... ] }
//   Supported query operators: <, <=, =, ==, >, >=, AND, OR.
//   absorbed_dose_rate is in uGy/hour; dose_equivalent_rate is in uSv/hour.

const BASE = "https://visualization.osdr.nasa.gov/radlab/api/";

// A bounded filter keeps the sample small. Widen or change the bounds to
// sample a different slice. (The full dataset is large.)
//
// NOTE: the RadLab service can return 504 (Gateway Time-out) on broad queries
// because the dataset is big. If that happens, narrow the query to a single
// instrument, e.g. 'instrument_id = "<id>" AND absorbed_dose_rate > 0', or run
// it again when the service is less busy. Available instrument ids can be read
// from ?id=instrument_id&format=json.
const QUERY = "absorbed_dose_rate>0 AND absorbed_dose_rate<1000";

interface RadLabTable {
  columns: string[];
  data?: (string | number | null)[][];
}

function mean(nums: number[]): number {
  if (nums.length === 0) return NaN;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function main() {
  const url =
    `${BASE}?query=${encodeURIComponent(QUERY)}` +
    `&columns=absorbed_dose_rate,dose_equivalent_rate&format=json`;
  process.stdout.write(`Fetching RadLab sample...\n${url}\n`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`RadLab ${res.status} ${res.statusText}`);
  }
  const table = (await res.json()) as RadLabTable;
  const rows = table.data ?? [];
  const col = (name: string) => table.columns.indexOf(name);
  const ai = col("absorbed_dose_rate");
  const di = col("dose_equivalent_rate");

  const absorbed: number[] = [];
  const equiv: number[] = [];
  for (const r of rows) {
    const a = Number(r[ai]);
    const d = Number(r[di]);
    if (Number.isFinite(a)) absorbed.push(a);
    if (Number.isFinite(d)) equiv.push(d);
  }

  process.stdout.write(`\nRows sampled: ${rows.length}\n`);
  process.stdout.write(
    `absorbed_dose_rate  avg: ${mean(absorbed).toFixed(3)} uGy/hour ` +
      `(n=${absorbed.length})\n`,
  );
  process.stdout.write(
    `dose_equivalent_rate avg: ${mean(equiv).toFixed(3)} uSv/hour ` +
      `(n=${equiv.length})\n`,
  );
  process.stdout.write(
    `\nCopy these into src/data/constants.ts and remove the ` +
      `'unverified: true' flags on the radiation constants.\n`,
  );
}

main().catch((err) => {
  console.error("RadLab sampler failed:", err.message ?? err);
  process.exit(1);
});
