const Engine = require("./out/server/Engine");
const NationalEconomyApp = require("./out/server/NationalEconomy");

const engine = new Engine<NationalEconomyApp>();
const app = new NationalEconomyApp(engine);
engine.run(app);

