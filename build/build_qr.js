// Writes site/assets/join-qr.svg: a QR code for the participant site address (joinUrl in site/data/course.js).
// The presentation shows it on the Kick-off join panel. It holds the address only, never a login.
// Usage (from the project root): NODE_PATH=build/node_modules node build/build_qr.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const QRCode = require("qrcode");

const ROOT = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, "site", "data", "course.js"), "utf8"), sandbox);
const url = sandbox.window.COURSE.joinUrl;
if (!url) { console.error("joinUrl is missing in site/data/course.js"); process.exit(1); }

QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#0E1430", light: "#FFFFFF" } }).then((svg) => {
  const out = path.join(ROOT, "site", "assets", "join-qr.svg");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg);
  console.log("wrote", path.relative(ROOT, out), "for", url);
}).catch((e) => { console.error(e); process.exit(1); });
