"use strict";

let pkg = require("./out/browser/Engine");
const Engine = pkg.Engine;

const engine = new Engine();
window.engine = engine;
engine.run();
