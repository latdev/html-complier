const express = require("express");
const app = express();
const pug = require('pug');
const path = require("path");
const util = require("util");
const fs = require("fs");
const ts = require("typescript");
const lessc = require("less");

async function fmtime(path) {
    return new Promise(function(resolve, reject) {
        fs.access(path, fs.F_OK, function(err) {
            if (err !== null)
                return reject(err) && false;
            fs.stat(path, function(err, stats) {
                if (err !== null)
                    return reject(err) && false;
                resolve(new Date(util.inspect(stats.mtime)).getTime() / 1000);
            });
        });
    });
}

app.get(/\.html$/, async function(req, res) {
    let infile = path.join(__dirname, "source", req.url.replace(/\.html$/, '.pug')),
        outfile = path.join(__dirname, "public", req.url),
        intime = 0;
    try {
        intime = await fmtime(infile);
        fs.mkdirSync(path.resolve(outfile), { recursive: true });
    } catch {}
    if (intime > 0) {
        try {
            let compiler = pug.compileFile(infile, {
                basedir: path.join(__dirname, "source"),
                pretty: true,
                compileDebug: true,
                cache: false,
            });
            let html = compiler({});
            fs.writeFileSync(outfile, html, 'utf8');
            res.send(html);
        } catch (error) {
            res.type('txt').send(error.message)
        }
    } else {
        res.sendStatus(404);
    }
});

app.get(/\.mjs$/, async function(req, res) {
    let infile = path.join(__dirname, 'source', req.url.replace(/\.mjs$/, '.ts')),
        outfile = path.join(__dirname, 'public', req.url),
        intime = 0;

    try {
        intime = await fmtime(infile);
        fs.mkdirSync(path.resolve(outfile), { recursive: true });
    } catch {}

    if (intime > 0) {
        try {
            let jscode = await ts.transpileModule(fs.readFileSync(infile).toString(), {
                compilerOptions: {
                    module: ts.ModuleKind.ES6,
                    allowSyntheticDefaultImports: true,
                    target: "esnext",
                    allowJs: false,
                    strict: true,
                    "lib": ["dom", "es6"],
                    "target": "es6",
                    "sourceMap": false,
                    "removeComments": true,
                },
                include: [
                    path.join(__dirname, "source")
                ]
            });
            fs.writeFileSync(outfile, jscode.outputText, 'utf8');
            res.header("Content-Type", "application/javascript; charset=UTF-8");
            res.send(jscode.outputText);
        } catch (error) {
            res.type('txt').send(error.message)
        }
    } else {
        res.sendStatus(404);
    }
});

app.get(/\.css$/, async function(req, res) {
    let infile = path.join(__dirname, "source", req.url.replace(/\.css$/, '.less')),
        outfile = path.join(__dirname, "public", req.url),
        mapfile = path.join(__dirname, "public", req.url.replace(/\.css$/, '.css.map')),
        mapindex = req.url.replace(/\.css$/, '.css.map'),
        intime = 0;
    try {
        intime = await fmtime(infile);
        fs.mkdirSync(path.resolve(outfile), { recursive: true });
    } catch {}    
    if (intime > 0) {    
        try {
            let output = await lessc.render(fs.readFileSync(infile).toString(), {
                filename: path.resolve(infile),
                sourceMap: {
                    outputFilename: mapindex
                }
            });

            fs.writeFileSync(outfile, output.css, 'utf8');
            res.header("Content-Type", "text/css; charset=UTF-8");
            res.send(output.css);
        } catch (error) {
            res.type('txt').send(error.message)
        }
    } else {
        res.sendStatus(404);
    }
});

app.get('', function(req, res, next) {
    res.redirect(302, '/index.html');
});

app.listen(8090, "127.0.0.1", function(err) {
    if (err !== void 0) {
        console.error(err);
    } else {
        console.log("server started on http://localhost:8090/");
    }
})