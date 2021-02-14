import * as net from "net";
import * as dns from "dns";
import { EventEmitter } from "events";
import { Packet } from "./packet";
import { Encrypt } from "./lib/encryption";
import * as definitions from "./definitions.json";
import { Definitions } from "./lib/definitions";

export interface ClientOptions {
    host?: string,
    port?: number,
    username?: string
}

export class Client extends EventEmitter {
    private _socket: net.Socket;
    private _packetModule: Packet = new Packet();
    private _encrypt: Encrypt = new Encrypt();
    private _definitions: Definitions = new Definitions(definitions);
    private _encryptionEnabled: boolean = false;
    private _packetQueue: Buffer = Buffer.alloc(0);

    public host?: string = "0.0.0.0";
    public port?: number = 25565;
    public username?: string = "Bot";
    public connected: boolean = false;

    constructor(options: ClientOptions = {}) {
        super();

        if (options.username) this.username = options.username;
        if (options.host) this.host = options.host;
        if (options.port) this.port = options.port;

        this.setSocket();
    }

    async getAddresses(host, port) : Promise<[string, number]> {
        return port === 25565 ? await new Promise((resolve, _reject) => dns.resolveSrv(`_minecraft._tcp.${host}`, (_err, addresses) => resolve(addresses ? [addresses[0].name, addresses[0].port] : [host, port]))) : [host, port];
    }

    async parseEncryptionKeyRequest(data) {
        let {sharedSecret, verifyToken} = await this._encrypt.set(data.publicKey, data.verifyToken);

        this.write("encryption_key_response", {sharedSecret, verifyToken});
    }

    async setSocket() {
        let [host, port] = await this.getAddresses(this.host, this.port);

        this._socket = net.connect({host, port});

        this._socket.on("connect", () => {
            this.connected = true;

            this.write("handshake", {
                protocolVersion: 61,
                username: this.username,
                serverHost: host,
                serverPort: port
            });

            this.emit("connect");
        });

        this._socket.on("end", this.onEnd.bind(this));
        this._socket.on("close", this._socket.destroy.bind(this._socket));
        this._socket.on("timeout", this._socket.destroy.bind(this._socket));

        this._socket.on("error", (err: Error) => {
            this.emit("error", err);
            this.end();
        });

        this._socket.on("data", (data: Buffer) => {
            if (this._encryptionEnabled)
                data = this._encrypt.decipher.update(data);

            let buffer = Buffer.concat([this._packetQueue, data]);

            while (buffer.length > 0) {
                try {
                    var packet = this._packetModule.parse(buffer);
                } catch(err) {
                    this.emit("error", err);
                    this.end();

                    return;
                }

                if (!packet) {
                    break;
                } else {
                    buffer = packet.buffer;
                    let packetName = this._definitions.getName(packet.id);

                    if (packetName === "keep_alive") {
                        this.write("keep_alive", {keepAliveId: packet.data.keepAliveId});
                    } else if (packetName === "encryption_key_request") {
                        this.parseEncryptionKeyRequest(packet.data);
                    } else if (packetName === "encryption_key_response") {
                        this._encryptionEnabled = true;

                        this.write("client_statuses", {payload: 0});
                    } else if (packetName === "disconnect") {
                        this.end();
                    }

                    if (packetName && typeof(packetName) === "string") {
                        this.emit(packetName, packet.data);
                    }
                }
            }

            this._packetQueue = buffer;
        });

        return true;
    }

	write(packetName: string, data: object) {
        // @ts-ignore
        if (!this._socket || this._socket._writableState.ended)
            return;

        let id = this._definitions.getId(packetName);

        if (id === false) {
            this.emit("error", new Error(`Packet with name "${packetName}" doesn't exists.`));
            return;
        } else if (typeof(id) === "number") {
            let packet = this._packetModule.create(id, data);

            this._socket.write(this._encryptionEnabled ? this._encrypt.cipher.update(packet.buffer) : packet.buffer);
        }
	}

    end() {
        this._socket.destroy();
    }

    onEnd() {
        this.connected = false;
        this.emit("end");

        this._socket.removeAllListeners();

        return true;
    }
}
