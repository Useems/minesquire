import { TypedEmitter } from "tiny-typed-emitter";
import { Plugins, PluginsEvents, Plugin } from "./lib";
import { Client, ClientOptions } from "./protocol";
import { readdir } from "fs";
import { join } from "path";

export interface BotOptions extends ClientOptions {
    plugins?: {[key: string]: Plugin}
};

export interface BotEvents extends PluginsEvents {
    login: () => void;
    connect: () => void;
    kicked: (reason: string) => void;
    error: (err: Error) => void;
    end: () => void;
}

export interface Bot extends Plugins {};

export class Bot extends TypedEmitter<BotEvents> implements Plugins {
    _client: Client;
    _plugins: Plugin[] = [];

    constructor(options: BotOptions = <BotOptions>{}) {
        super();

        if (!options.plugins)
            options.plugins = {};

        this._client = new Client(options);

        this._client.on("connect", () => this.emit("connect"));
        this._client.on("error", (err: Error) => this.emit("error", err));

        this._client.on("end", () =>  {
            this._client.write("disconnect", {reason: ""});
            this.emit("end");
        });

        this._client.on("login_request", (packet) => {
            let path = join(__dirname, "/lib/plugins");

            readdir(path, (err, files) => {
                if (err)
                    return this.emit("error", err);

                let plugins: {[key: string]: Plugin} = {};

                files.forEach((fileName) => {
                    if (fileName.slice(fileName.lastIndexOf('.') + 1) === "js") {
                        plugins[fileName.slice(0, fileName.lastIndexOf('.'))] = require(join(path, fileName)).default;
                    }
                });

                for (let i in plugins)
                    this.loadPlugin(plugins[i], options.plugins[i]);

                this.emit("login");
            });
        });

        this._client.on("disconnect", (packet) => this.emit("kicked", packet.reason || "No reason"));
    }

    loadPlugin(plugin: Plugin, options: {[key: string]: any} = {}) : boolean {
        if (this.hasPlugin(plugin))
            return false;

        this._plugins.push(plugin);

        // @ts-ignore
        new plugin(this, options);

        return true;
    }

    hasPlugin(plugin: Plugin) : boolean {
        return this._plugins.indexOf(plugin) >= 0
    }

    end() : void {
        this._client.end();
    }
}
