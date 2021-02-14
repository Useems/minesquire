import { Bot } from "../..";

export interface ChatEvents {
    raw_chat: (message: string) => void;
    chat: (message: string) => void;
}

export default class Chat {
    private _messageQueue: string[] = [];
    private _delay: number = 1000;
    private _isWorking: boolean = false;

    constructor(public bot: Bot, options: {[key: string]: any} = {}) {
        if (options.delay && typeof options.delay === "number")
            this._delay = options.delay;

        this.bot._client.on("chat_message", (packet) => {
            this.bot.emit("raw_chat", packet.message);
            this.bot.emit("chat", packet.message.replace(/\§./g, ''));
        });

        this.bot.chat = this.chat.bind(this);
    }

    chat(message: (string|null) = "") {
        if (message)
            this._messageQueue = [...this._messageQueue, ...message.match(/.{1,100}/g)];

        if (this._isWorking || this._messageQueue.length <= 0) return

        this._isWorking = true;
        this.bot._client.write("chat_message", {message: this._messageQueue.shift()});

        if (this._messageQueue.length > 0)
            setTimeout(() => { this._isWorking = false; this.chat() }, this._delay);
        else
        this._isWorking = false;
    }
}
