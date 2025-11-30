"use client";

import SecureMobileApp from "@/components/SecureMobileApp";

export default function MobilePage() {
  // In production, this would come from authentication
  const apiKey = process.env.NEXT_PUBLIC_SETTLER_API_KEY || "";

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">API key not configured</p>
          <p className="text-gray-600 mt-2">
            Please set NEXT_PUBLIC_SETTLER_API_KEY environment variable
          </p>
        </div>
      </div>
    );
  }

  return <SecureMobileApp apiKey={apiKey} />;
}
