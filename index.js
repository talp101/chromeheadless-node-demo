const chromeLauncher = require('lighthouse/chrome-launcher/chrome-launcher');
const CDP = require('chrome-remote-interface');
const file = require('fs');
const page = "https://www.google.com";

(async function () {
  async function launchChrome() {
    return await chromeLauncher.launch({
      chromeFlags: [
        '--disable-gpu',
        '--headless'
      ]
    });
  }
  const chrome = await launchChrome();
  const protocol = await CDP({
    port: chrome.port
  });

  // Extract the DevTools protocol domains we need and enable them.
  // See API docs: https://chromedevtools.github.io/devtools-protocol/
  const {
    DOM,
    Page,
    Emulation,
    Runtime
  } = protocol;
  await Promise.all([Page.enable(), Runtime.enable(), DOM.enable()]);

  Page.navigate({
    url: page
  });

  // Wait for window.onload before doing stuff.

  Page.loadEventFired(async () => {

    const script1 = "document.documentElement.innerHTML"
    const script2 = 'document.body.style.backgroundColor = "red";';
    // Evaluate the JS expression in the page.
    const result = await Runtime.evaluate({
      expression: script2
    });
    console.log(result.result.value);
    const ss = await Page.captureScreenshot({ format: 'png', fromSurface: true });
    file.writeFile('screenshot.png', ss.data, 'base64', function (err) {
      if (err) {
        console.log(err);
      }
    });

    protocol.close();
    chrome.kill(); // Kill Chrome.
  });

})();
