const { JSDOM } = require('jsdom');

JSDOM.fromURL('http://localhost:4173/', {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  const window = dom.window;

  // Capture console errors
  window.console.error = (...args) => {
    console.log("BROWSER ERROR:", ...args);
  };
  window.console.warn = (...args) => {
    console.log("BROWSER WARN:", ...args);
  };

  window.addEventListener("error", (event) => {
    console.log("UNCAUGHT ERROR:", event.error ? event.error.message : event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.log("UNHANDLED REJECTION:", event.reason);
  });

  setTimeout(() => {
    console.log("Waited 2 seconds. Exiting.");
    process.exit(0);
  }, 2000);
}).catch(err => {
  console.log("Failed to load JSDOM:", err);
});
