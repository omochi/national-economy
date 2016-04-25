"use strict";
let pkg = require("./out/server/Engine");
const Engine = pkg.Engine;
pkg = require("./out/server/NationalEconomy");
const NationalEconomyApp = pkg.NationalEconomyApp;

const app = new NationalEconomyApp();

const engine = new Engine(app);
engine.run();

