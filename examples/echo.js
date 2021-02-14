const minesquire = require("minesquire");

var bot = new minesquire.Bot({
    host: process.argv[2],
    port: parseInt(process.argv[3]),
    username: process.argv[4]
});

bot.on("login", () => {
    bot.chat("Hello, world!");
});
