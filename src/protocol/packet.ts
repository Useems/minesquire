import { Vec3 } from "vec3";
import ByteArray from "./lib/bytearray";
import * as protocols from "./protocol.json";

export interface PacketOptions {
    maxAcumulativeErrors?: number
}

export interface PacketData {
    id: number,
    data: {[key: string]: any},
    buffer: Buffer
}

export class Packet {
    acumulativeErrors: number = 0;
    maxAcumulativeErrors: number = 300;

    constructor(options: PacketOptions = {}) {
        if (options.maxAcumulativeErrors)
            this.maxAcumulativeErrors = options.maxAcumulativeErrors;
    }

    create(packetId: number, data: object) {
        if (packetId in protocols) {
            let protocol = protocols[packetId];
            let buffer = new ByteArray().writeUByte(packetId);

            if (protocol instanceof Array)
                for (let i in protocol) {
                    if (protocol[i].name === null) continue;

                    buffer.get("write", protocol[i].type)(data[protocol[i].name]);
                }
            else
                buffer.get("write", protocol.type)(data[protocol.name]);

            return buffer;
        }

        return null;
    }

    parse(buffer: Buffer) : PacketData {
        let packet =  new ByteArray(buffer);
        let packetId = packet.readUByte();
        let result = {};

        if (packetId in protocols) {
            let protocol = protocols[packetId];

            try {
                if (protocol instanceof Array)
                    for (let i in protocol) {
                        if (protocol[i].name === null) continue;

                        result[protocol[i].name] = packet.get("read", protocol[i].type)();

                        if (result[protocol[i].name] === null) throw new Error("Null value received.");
                    }
                else {
                    result = packet.get("read", protocol.type)();
                    if (result === null) throw new Error("Null value received.");
                }

                this.acumulativeErrors = 0;
            } catch(err) {
                this.acumulativeErrors++;

                if (this.acumulativeErrors > this.maxAcumulativeErrors) {
                    throw new Error(err);
                } else
                    return null;
            }
        } else
            throw new Error(`Packet Id (${packetId}) not found.`);

        return {
            id: packetId,
            data: result,
            buffer: packet.buffer
        };
    }
}
