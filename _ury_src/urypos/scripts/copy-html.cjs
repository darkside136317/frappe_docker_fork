const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const src = path.join(root, "..", "ury", "public", "urypos", "index.html");
const destDir = path.join(root, "..", "ury", "www");
const dest = path.join(destDir, "urypos.html");
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
