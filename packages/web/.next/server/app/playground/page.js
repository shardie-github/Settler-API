(()=>{var e={};e.id=383,e.ids=[383],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},524:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>m,tree:()=>d}),r(5247),r(7718),r(7824);var a=r(3282),s=r(5736),o=r(3906),n=r.n(o),i=r(6880),l={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);r.d(t,l);let d=["",{children:["playground",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,5247)),"/workspace/packages/web/src/app/playground/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,7718)),"/workspace/packages/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,7824,23)),"next/dist/client/components/not-found-error"]}],c=["/workspace/packages/web/src/app/playground/page.tsx"],p="/playground/page",u={require:r,loadChunk:()=>Promise.resolve()},m=new a.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/playground/page",pathname:"/playground",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},7229:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,4424,23)),Promise.resolve().then(r.t.bind(r,7752,23)),Promise.resolve().then(r.t.bind(r,5275,23)),Promise.resolve().then(r.t.bind(r,9842,23)),Promise.resolve().then(r.t.bind(r,1633,23)),Promise.resolve().then(r.t.bind(r,9224,23))},4738:()=>{},7069:(e,t,r)=>{Promise.resolve().then(r.bind(r,267))},267:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o});var a=r(3227),s=r(3677);function o(){let[e,t]=(0,s.useState)(""),[r,o]=(0,s.useState)(`import Settler from "@settler/sdk";

const client = new Settler({
  apiKey: "${e||"sk_your_api_key"}",
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
console.log("Report:", report.data.summary);`);return a.jsx("div",{className:"min-h-screen p-8",children:(0,a.jsxs)("div",{className:"max-w-6xl mx-auto",children:[a.jsx("h1",{className:"text-3xl font-bold mb-6",children:"Settler Playground"}),(0,a.jsxs)("div",{className:"mb-4",children:[a.jsx("label",{className:"block text-sm font-medium mb-2",children:"API Key (optional for demo)"}),a.jsx("input",{type:"text",value:e,onChange:e=>{t(e.target.value),o(r.replace(/sk_your_api_key/g,e.target.value||"sk_your_api_key"))},placeholder:"sk_your_api_key",className:"w-full p-2 border rounded"})]}),(0,a.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{children:[a.jsx("h2",{className:"text-xl font-semibold mb-2",children:"Code Editor"}),a.jsx("textarea",{value:r,onChange:e=>o(e.target.value),className:"w-full h-96 p-4 font-mono text-sm border rounded",spellCheck:!1})]}),(0,a.jsxs)("div",{children:[a.jsx("h2",{className:"text-xl font-semibold mb-2",children:"Output"}),a.jsx("div",{className:"w-full h-96 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded overflow-auto",children:a.jsx("div",{className:"text-gray-500",children:"// Run code to see output"})})]})]}),a.jsx("div",{className:"mt-4",children:a.jsx("button",{className:"px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",children:"Run Code"})})]})})}},7718:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o,metadata:()=>s});var a=r(9013);r(5556);let s={title:"Settler - Reconciliation as a Service",description:"Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems"};function o({children:e}){return a.jsx("html",{lang:"en",children:a.jsx("body",{children:e})})}},5247:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});let a=(0,r(3189).createProxy)(String.raw`/workspace/packages/web/src/app/playground/page.tsx#default`)},5556:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[592],()=>r(524));module.exports=a})();