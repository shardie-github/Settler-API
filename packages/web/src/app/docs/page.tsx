export default function Docs() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Documentation</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
            <p className="text-gray-600 mb-4">
              Reconcilify is a Reconciliation-as-a-Service API that automates
              financial and event data reconciliation across fragmented SaaS and
              e-commerce ecosystems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Installation</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
              <code>npm install @reconcilify/sdk</code>
            </pre>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">POST /api/v1/jobs</h3>
                <p className="text-gray-600">Create a new reconciliation job</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">GET /api/v1/jobs/:id</h3>
                <p className="text-gray-600">Get reconciliation job details</p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold">GET /api/v1/reports/:jobId</h3>
                <p className="text-gray-600">Get reconciliation report</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
