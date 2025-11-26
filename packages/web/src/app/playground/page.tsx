"use client";

import { useState } from "react";

export default function Playground() {
  const [apiKey, setApiKey] = useState("");
  const [code, setCode] = useState(`import Reconcilify from "@reconcilify/sdk";

const client = new Reconcilify({
  apiKey: "${apiKey || "rk_your_api_key"}",
});

// Create a reconciliation job
const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: {
    adapter: "shopify",
    config: {
      apiKey: process.env.SHOPIFY_API_KEY,
    },
  },
  target: {
    adapter: "stripe",
    config: {
      apiKey: process.env.STRIPE_SECRET_KEY,
    },
  },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
    conflictResolution: "last-wins",
  },
});

console.log("Job created:", job.data.id);

// Get reconciliation report
const report = await client.reports.get(job.data.id);
console.log("Report:", report.data.summary);`);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Reconcilify Playground</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            API Key (optional for demo)
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setCode(code.replace(/rk_your_api_key/g, e.target.value || "rk_your_api_key"));
            }}
            placeholder="rk_your_api_key"
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Code Editor</h2>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 p-4 font-mono text-sm border rounded"
              spellCheck={false}
            />
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Output</h2>
            <div className="w-full h-96 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded overflow-auto">
              <div className="text-gray-500">// Run code to see output</div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Run Code
          </button>
        </div>
      </div>
    </div>
  );
}
