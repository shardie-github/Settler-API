import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Reconcilify</h1>
        <p className="text-xl text-gray-600 mb-8">
          Reconciliation-as-a-Service API
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/playground"
            className="p-6 border rounded-lg hover:bg-gray-50 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">Playground</h2>
            <p className="text-gray-600">
              Interactive playground to test reconciliation jobs
            </p>
          </Link>

          <Link
            href="/docs"
            className="p-6 border rounded-lg hover:bg-gray-50 transition"
          >
            <h2 className="text-2xl font-semibold mb-2">Documentation</h2>
            <p className="text-gray-600">
              Complete API documentation and guides
            </p>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Quick Start</h2>
          <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
            <code>{`npm install @reconcilify/sdk

import Reconcilify from "@reconcilify/sdk";

const client = new Reconcilify({
  apiKey: "rk_your_api_key",
});

const job = await client.jobs.create({
  name: "Shopify-Stripe Reconciliation",
  source: { adapter: "shopify", config: {} },
  target: { adapter: "stripe", config: {} },
  rules: {
    matching: [
      { field: "order_id", type: "exact" },
      { field: "amount", type: "exact", tolerance: 0.01 },
    ],
  },
});`}</code>
          </pre>
        </div>
      </div>
    </main>
  );
}
