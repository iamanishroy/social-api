import React from "react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-gray-200 dark:selection:bg-gray-800">
      <div className="max-w-3xl mx-auto p-10">
        <header className="mb-16">
          <h1 className="text-xl font-bold tracking-tight mb-2">Social API</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A high-performance, minimalist API for fetching Twitter/X tweet
            data, HTML renders, and SVG snapshots.
          </p>
        </header>

        <section className="space-y-12">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">
              Endpoints
            </h2>

            <div className="space-y-8">
              <Endpoint
                method="GET"
                path="/api/tweet"
                description="Returns complete tweet data in JSON format."
                example='curl "https://social-api.anishroy.com/api/tweet?url={TWEET_URL}"'
                params={[
                  {
                    name: "url",
                    type: "query",
                    description: "The full Twitter/X status URL.",
                  },
                ]}
              />

              <Endpoint
                method="GET"
                path="/api/tweet-html"
                description="Returns a clean HTML render of the tweet."
                example="https://social-api.anishroy.com/api/tweet-html?url={TWEET_URL}"
              />

              <Endpoint
                method="GET"
                path="/api/tweet-svg"
                description="Returns a vector SVG capture of the tweet."
                example="https://social-api.anishroy.com/api/tweet-svg?url={TWEET_URL}"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">
              Example
            </h2>
            <p className="text-sm mb-2">Try it out with a real tweet:</p>
            <a
              href="/api/tweet?url=https://x.com/iamanishroy/status/1595377607071121410"
              className="text-xs font-mono border-b border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors"
            >
              /api/tweet?url=https://x.com/iamanishroy/status/1595377607071121410
            </a>
          </div>
        </section>

        <footer className="mt-32 pt-6 border-t border-gray-100 dark:border-gray-900 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Built by{" "}
            <a
              href="https://anishroy.com"
              className="text-black dark:text-white border-b border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors"
            >
              Anish Roy
            </a>
          </span>
          <a
            href="https://github.com/iamanishroy/social-api"
            className="text-black dark:text-white border-b border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors"
          >
            Source
          </a>
        </footer>
      </div>
    </div>
  );
}

function Endpoint({ method, path, description, example, params = [] }: any) {
  return (
    <div className="group">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[10px] font-bold border border-black dark:border-white px-1.5 py-0.5 leading-none">
          {method}
        </span>
        <span className="font-mono text-sm font-semibold">{path}</span>
      </div>
      <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">
        {description}
      </p>
      <pre className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-900 p-4 rounded text-xs font-mono overflow-x-auto mb-3">
        <code>{example}</code>
      </pre>
      {params.length > 0 && (
        <div className="space-y-1">
          {params.map((param: any) => (
            <p
              key={param.name}
              className="text-[11px] text-gray-500 dark:text-gray-400"
            >
              <span className="text-gray-400 dark:text-gray-500">
                {param.type}
              </span>{" "}
              <span className="text-black dark:text-white font-medium">
                {param.name}
              </span>{" "}
              — {param.description}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
