const fs = require("fs"),
    path = require("path");

function renameFiles(e, s) {
    fs.readdirSync(e).forEach((i) => {
        const r = path.join(e, i);
        fs.statSync(r).isDirectory()
            ? renameFiles(r, s)
            : i.endsWith(".js") && fs.renameSync(r, r.replace(/\.js$/, s));
    });
}

renameFiles(path.join(__dirname, "../dist/cjs"), ".cjs");
renameFiles(path.join(__dirname, "../dist/esm"), ".mjs");