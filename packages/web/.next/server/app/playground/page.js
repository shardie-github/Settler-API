(()=>{var e={};e.id=383,e.ids=[383],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},524:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>o.a,__next_app__:()=>m,originalPathname:()=>d,pages:()=>p,routeModule:()=>u,tree:()=>c}),a(5247),a(7718),a(7824);var r=a(3282),s=a(5736),n=a(3906),o=a.n(n),i=a(6880),l={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>i[e]);a.d(t,l);let c=["",{children:["playground",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,5247)),"/workspace/packages/web/src/app/playground/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(a.bind(a,7718)),"/workspace/packages/web/src/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,7824,23)),"next/dist/client/components/not-found-error"]}],p=["/workspace/packages/web/src/app/playground/page.tsx"],d="/playground/page",m={require:a,loadChunk:()=>Promise.resolve()},u=new r.AppPageRouteModule({definition:{kind:s.x.APP_PAGE,page:"/playground/page",pathname:"/playground",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7229:(e,t,a)=>{Promise.resolve().then(a.t.bind(a,4424,23)),Promise.resolve().then(a.t.bind(a,7752,23)),Promise.resolve().then(a.t.bind(a,5275,23)),Promise.resolve().then(a.t.bind(a,9842,23)),Promise.resolve().then(a.t.bind(a,1633,23)),Promise.resolve().then(a.t.bind(a,9224,23))},4738:()=>{},7069:(e,t,a)=>{Promise.resolve().then(a.bind(a,267))},267:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n});var r=a(3227),s=a(3677);function n(){let[e,t]=(0,s.useState)(""),[a,n]=(0,s.useState)(`import Settler from "@settler/sdk";

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
console.log("Report:", report.data.summary);`);return r.jsx("div",{className:"min-h-screen p-8",children:(0,r.jsxs)("div",{className:"max-w-6xl mx-auto",children:[r.jsx("h1",{className:"text-3xl font-bold mb-6",children:"Settler Playground"}),(0,r.jsxs)("div",{className:"mb-4",children:[r.jsx("label",{className:"block text-sm font-medium mb-2",children:"API Key (optional for demo)"}),r.jsx("input",{type:"text",value:e,onChange:e=>{t(e.target.value),n(a.replace(/sk_your_api_key/g,e.target.value||"sk_your_api_key"))},placeholder:"sk_your_api_key",className:"w-full p-2 border rounded"})]}),(0,r.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4",children:[(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-xl font-semibold mb-2",children:"Code Editor"}),r.jsx("textarea",{value:a,onChange:e=>n(e.target.value),className:"w-full h-96 p-4 font-mono text-sm border rounded",spellCheck:!1})]}),(0,r.jsxs)("div",{children:[r.jsx("h2",{className:"text-xl font-semibold mb-2",children:"Output"}),r.jsx("div",{className:"w-full h-96 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded overflow-auto",children:r.jsx("div",{className:"text-gray-500",children:"// Run code to see output"})})]})]}),r.jsx("div",{className:"mt-4",children:r.jsx("button",{className:"px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",children:"Run Code"})})]})})}},7718:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>o,metadata:()=>s,viewport:()=>n});var r=a(9013);a(5556);let s={title:"Settler - Reconciliation as a Service",description:"Automate financial and event data reconciliation across fragmented SaaS and e-commerce ecosystems",manifest:"/manifest.json",appleWebApp:{capable:!0,statusBarStyle:"default",title:"Settler"},formatDetection:{telephone:!1},icons:{icon:[{url:"/icon-192x192.png",sizes:"192x192",type:"image/png"},{url:"/icon-512x512.png",sizes:"512x512",type:"image/png"}],apple:[{url:"/icon-192x192.png",sizes:"192x192",type:"image/png"}]}},n={width:"device-width",initialScale:1,maximumScale:5,userScalable:!0,themeColor:"#2563eb",viewportFit:"cover"};function o({children:e}){return(0,r.jsxs)("html",{lang:"en",children:[(0,r.jsxs)("head",{children:[r.jsx("link",{rel:"manifest",href:"/manifest.json"}),r.jsx("meta",{name:"mobile-web-app-capable",content:"yes"}),r.jsx("meta",{name:"apple-mobile-web-app-capable",content:"yes"}),r.jsx("meta",{name:"apple-mobile-web-app-status-bar-style",content:"default"}),r.jsx("meta",{name:"apple-mobile-web-app-title",content:"Settler"})]}),r.jsx("body",{children:e})]})}},5247:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(3189).createProxy)(String.raw`/workspace/packages/web/src/app/playground/page.tsx#default`)},5556:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[193,679],()=>a(524));module.exports=r})();