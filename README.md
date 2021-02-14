# Minesquire

Create Minecraft bots for version 1.5.2

## Installation

Use the package manager [npm](https://www.npmjs.com) to install minesquire.

```bash
npm install minesquire
```

## Usage

```js
const minesquire = require("minesquire");

var bot = new minesquire.Bot({
    username: "Bot",
    host: "localhost",
    port: 25565
});

bot.on("login", () => {
    console.log("Logged in");
});

bot.on("chat", (message = "") => {
    console.log(`[Message] ${message}`);
});

bot.on("kicked", console.log);
bot.on("error", console.log);
```
## License
[MIT](https://choosealicense.com/licenses/mit/)