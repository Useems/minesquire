import { Vec3 } from "vec3";

export interface Look {
    yaw: number,
    pitch: number,
    onGround: boolean
}

export interface PlayerPosition {
    position: Vec3,
    stance: number,
    onGround: boolean
}

export interface PlayerPositionAndLook extends PlayerPosition, Look {};

export interface UpdateScore {
    itemName: string,
    remove: boolean,
    scoreName?: string,
    value?: number
}

export interface Team {
    teamName: string,
    mode: number,
    displayName?: string,
    prefix?: string,
    suffix?: string,
    friendlyFire?: number,
    players?: string[]
}

export interface ObjectData {
    intField: number,
    velocity?: Vec3
}

export interface EntityMetadata {
    [key: string]: any
}

export interface Slot {
    id: number,
    itemCount?: number,
    itemDamage?: number,
    nbt?: {[key: string]: any}
}

export interface ChunkMeta {
    chunkX: number,
    chunkZ: number,
    bitMap: number,
    addBitMap: number
}

export interface Chunk {
    skyLight: boolean,
    compressedData: Buffer
    meta: ChunkMeta[]
}

const entityMetadataTypes = ["byte", "short", "int", "float", "string", "slot", "intVec3"];

function capitalize(string: string) : string {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export default class ByteArray {
	constructor(private _buffer?: Buffer) {
		this._buffer = _buffer ? Buffer.from(_buffer) : Buffer.alloc(0);
	}

	get(method: string = "get", type: string = "int") {
		return this[method + capitalize(type)].bind(this);
	}

	get buffer() : Buffer {
		return this._buffer;
	}

	write(value: any) : ByteArray {
		this._buffer = Buffer.concat([this._buffer, Buffer.from(value)]);

		return this;
	}

	read(len) : Buffer {
		len = len >= 0 ? len : this._buffer.length;

		if (len > this._buffer.length) return null;

		let value = this._buffer.slice(0, len);
		this._buffer = this._buffer.slice(len);

		return value;
	}

	writeByte(value) : ByteArray {
		let buffer = Buffer.alloc(1);
		buffer.writeInt8(value);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readByte() : number {
		let value = this._buffer.slice(0, 1).readInt8();
		this._buffer = this._buffer.slice(1);

		return value;
	}

	writeUByte(value) : ByteArray {
		let buffer = Buffer.alloc(1);
		buffer.writeUInt8(value);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readUByte() : number {
		let value = this._buffer.slice(0, 1).readUInt8();
		this._buffer = this._buffer.slice(1);

		return value;
	}

	writeShort(value) : ByteArray {
		let buffer = Buffer.alloc(2);
		buffer.writeInt16BE(value);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readShort() : number {
		let value = this._buffer.slice(0, 2).readInt16BE();
		this._buffer = this._buffer.slice(2);

		return value;
	}

	writeUShort(value) : ByteArray {
		let buffer = Buffer.alloc(2);
		buffer.writeUInt16BE(value);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readUShort() : number {
		let value = this._buffer.slice(0, 2).readUInt16BE();
		this._buffer = this._buffer.slice(2);

		return value;
	}

	writeInt(value) : ByteArray {
		let buffer = Buffer.alloc(4);
		buffer.writeInt32BE(value);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readInt() : number {
		let value = this._buffer.slice(0, 4).readInt32BE();
		this._buffer = this._buffer.slice(4);

		return value;
	}

	writeUInt(value) {
		let buffer = Buffer.alloc(4);
		buffer.writeUInt32BE(value);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readUInt() : number {
		let value = this._buffer.slice(0, 4).readUInt32BE();
		this._buffer = this._buffer.slice(4);

		return value;
	}

	writeLong(value) : ByteArray {
		let buffer = Buffer.alloc(4);
		buffer.writeUInt32BE(value >> 8, 0);
		buffer.writeUInt32BE(value & 0x00ff, 4);

		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readLong() : number {
		let value = (this._buffer.readUInt32BE(0) << 8) + this._buffer.readUInt32BE(4);
		this._buffer = this._buffer.slice(8);

		return value;
	}

	writeDouble(value) : ByteArray {
		let buffer = Buffer.alloc(8);
		buffer.writeDoubleBE(value);
		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readDouble() : number {
		let value = this._buffer.slice(0, 8).readDoubleBE();
		this._buffer = this._buffer.slice(8);

		return value;
	}

	writeFloat(value) : ByteArray {
		let buffer = Buffer.alloc(4);
		buffer.writeFloatBE(value);
		this._buffer = Buffer.concat([this._buffer, buffer]);

		return this;
	}

	readFloat() : number {
		let value = this._buffer.slice(0, 4).readFloatBE();
		this._buffer = this._buffer.slice(4);

		return value;
	}

	writeBoolean(value) : ByteArray {
		return this.writeByte(value ? 1 : 0);
	}

	readBoolean() : boolean {
		return this.readByte() !== 0;
	}

	writeString(value) : ByteArray {
		this.writeShort(value.length);

		for (let i in value)
			this.writeUShort(value.charCodeAt(i));

		return this;
	}

	readString() : string {
		let len = this.readShort();
		let result = '';

		if (len > this.buffer.length) return null;

		for (let i = 0; i < len; i++)
			result += String.fromCharCode(this.readUShort());

		return result;
	}

	writeShortPacket(value: Buffer) : ByteArray {
		this.writeShort(value.length);
		this.write(value);

		return this;
	}

	readShortPacket() : Buffer {
		let objectLength = this.readShort();

		if (objectLength > this.buffer.length) return null;

		return this.read(objectLength);
	}

	readSlot() : Slot {
		let id = this.readShort();

		if (id === -1)
			return { id };

		let itemCount = this.readByte();
		let itemDamage = this.readShort();
		let nbtSize = this.readShort();

		if (nbtSize != -1) {
			if (nbtSize > this.buffer.length) return null;

			var nbt: Buffer = this.read(nbtSize);
		}

		return {id, itemCount, itemDamage, nbt};
	}

	readSlotArray() : Slot[] {
		let count = this.readShort();
		let result = [];

		for (let i = 0; i < count; i++) {
			let slot = this.readSlot();

			if (slot === null) return null;

			result.push(slot);
		}

		return result;
	}

	writeMapChunkBulk(skyLight: boolean, compressedData: Buffer, meta: ChunkMeta[]) : ByteArray {
		this.writeUShort(meta.length);
		this.writeInt(compressedData.length);
		this.writeBoolean(skyLight);
		this.write(compressedData);

		for (let i in meta) {
			let localMeta = meta[i];

			this.writeInt(localMeta.chunkX);
			this.writeInt(localMeta.chunkZ);
			this.writeUShort(localMeta.bitMap);
			this.writeUShort(localMeta.addBitMap);
		}

		return this;
	}

	readMapChunkBulk() : Chunk {
		let chunkColumnCount = this.readShort();
		let dataSize = this.readInt();
		let skyLight = this.readBoolean();

		if (dataSize + (12 * chunkColumnCount) > this._buffer.length) throw new Error("More data.");

		let compressedData = this.read(dataSize);
		if (compressedData === null) return null;

		let meta: ChunkMeta[] = [];

		for (let i = 0; i < chunkColumnCount; i++) {
			let chunkX = this.readInt();
			let chunkZ = this.readInt();
			let bitMap = this.readUShort();
			let addBitMap = this.readUShort();

			meta.push({chunkX, chunkZ, bitMap, addBitMap});
		}

		if (chunkColumnCount !== meta.length) throw new Error("ChunkColumnCount different from length of meta");

		return {skyLight, compressedData, meta};
	}

	writeEntityMetadata(metadata: EntityMetadata) : ByteArray {
		for (let i in metadata) {
			let localMetadata = metadata[i];

			this.writeUByte(localMetadata.item);
			this.get("write", localMetadata.typeName)(localMetadata.value);
		}

		return this;
	}

	readEntityMetadata() : EntityMetadata {
		let metadata = {};

		while (true) {
			let item = this.readUByte();
			if (item === 0x7f) break;

			let key = item & 0x1f;
			let type = item >> 5;
			let typeName = entityMetadataTypes[type];
			let dataType = this.get("read", typeName);
			let value = dataType();

			if (value === null) return null;

			metadata[key] = value;
		}

		return metadata;
	}

	writeIntVec3(x: number, y: number, z: number) : ByteArray {
		return this.writeInt(x).writeInt(y).writeInt(z);
	}

	readIntVec3() : Vec3 {
		if (12 > this._buffer.length) return null;

		let x = this.readInt();
		let y = this.readInt();
		let z = this.readInt();

		return new Vec3(x, y, z);
	}

	writeByteVec3(x: number, y: number, z: number) : ByteArray {
		return this.writeByte(x).writeByte(y).writeByte(z);
	}

	readByteVec3() : Vec3 {
		if (3 > this._buffer.length) return null;

		let x = this.readByte();
		let y = this.readByte();
		let z = this.readByte();

		return new Vec3(x, y, z);
	}

	writeShortVec3(x: number, y: number, z: number) : ByteArray {
		return this.writeShort(x).writeShort(y).writeShort(z);
	}

	readShortVec3() : Vec3 {
		if (6 > this._buffer.length) return null;

		let x = this.readShort();
		let y = this.readShort();
		let z = this.readShort();

		return new Vec3(x, y, z);
	}

	writeDoubleVec3(x: number, y: number, z: number) : ByteArray {
		return this.writeDouble(x).writeDouble(y).writeDouble(z);
	}

	readDoubleVec3() : Vec3 {
		if (24 > this._buffer.length) return null;

		let x = this.readDouble();
		let y = this.readDouble();
		let z = this.readDouble();

		return new Vec3(x, y, z);
	}

	writeIntArray8(values: number[]) : ByteArray {
		this.writeUByte(values.length);

		for (let i in values)
			this.writeInt(values[i]);

		return this;
	}

	readIntArray8() : number[] {
		let len = this.readUByte();
		let result = [];

		if (len * 3 > this._buffer.length) return null;

		for (let i = 0; i < len; i++)
			result.push(this.readInt());

		return result;
	}

	writeByteVectorArray(values: {x: number, y: number, z: number}[]) : ByteArray {
		this.writeUInt(values.length);

		for (let i in values)
			this.writeByteVec3(values[i].x, values[i].y, values[i].z);

		return this;
	}

	readByteVectorArray() : Vec3[] {
		let len = this.readUInt();
		let result = [];

		if (len * 3 > this._buffer.length) return null;

		for (let i = 0; i < len; i++)
			result.push(this.readByteVec3());

		return result;
	}

	writeByteArray32(buff: Buffer) : ByteArray {
		this.writeUInt(buff.length);
		this.write(buff);

		return this;
	}

	readByteArray32() : Buffer {
		let len = this.readUInt();

		if (len > this._buffer.length) return null;

		return this.read(len);
	}

	writeObjectData(data: ObjectData) : ByteArray {
		this.writeUInt(data.intField);

		if (data.intField != 0) {
			// @ts-ignore
			this.writeShort(data.velocity.x).writeShort(data.velocity.y).writeShort(data.velocity.z);
		}

		return this;
	}

	readObjectData() : ObjectData {
		let intField = this.readInt();

		if (intField === 0)
			return {intField};

		if (6 > this._buffer.length) return null;

		let velocityX = this.readShort();
		let velocityY = this.readShort();
		let velocityZ = this.readShort();

		return {intField, velocity: new Vec3(velocityX, velocityY, velocityZ)};
	}

	writeStringArray(value: string[]) : ByteArray {
		this.writeShort(value.length);

		for (let i in value)
			this.writeString(value[i]);

		return this;
	}

	readStringArray() : string[] {
		let len = this.readShort();
		let result = [];

		for (let i = 0; i < len; i++) {
			let str = this.readString()

			if (str === null) return null;

			result.push(str);
		}

		return result;
	}

	readTeam() {
		let teamName = this.readString();

		if (teamName === null || 4 > this._buffer.length) return null;

		let result: Team = {
			teamName, mode: this.readByte()
		};

		if (result.mode === 0 || result.mode === 2) {
			result.displayName = this.readString();
			result.prefix = this.readString();
			result.suffix = this.readString();
			result.friendlyFire = this.readByte();
		}

		if (result.mode === 0 || result.mode === 3 || result.mode === 4) {
			result.players = this.readStringArray();
		}

		for (let i in result) if (result[i] === null) return null;

		return result;
	}

	readUpdateScore() : UpdateScore {
		let result: UpdateScore = {
			itemName: this.readString(),
			remove: this.readBoolean()
		};

		if (result.remove === false) {
			result.scoreName = this.readString();
			result.value = this.readInt();
		}

		for (let i in result) if (result[i] === null) return null;

		return result;
	}

    writePlayerPosition(options: PlayerPosition) : ByteArray {
        /// @ts-ignore
        this.writeDouble(options.position.x).writeDouble(options.position.y).writeDouble(options.stance).writeDouble(options.position.z);
        this.writeBoolean(options.onGround);

        return this;
    }

    readPlayerPosition() : PlayerPosition {
        let x = this.readDouble();
        let y = this.readDouble();
        let stance = this.readDouble();
        let z = this.readDouble();
        let onGround = this.readBoolean();

        return {position: new Vec3(x, y, z), stance, onGround};
    }

    writePlayerPositionAndLook(options: PlayerPositionAndLook) : ByteArray {
        /// @ts-ignore
        this.writeDouble(options.position.x).writeDouble(options.position.y).writeDouble(options.stance).writeDouble(options.position.z);

        this.writeFloat(options.yaw).writeFloat(options.pitch).writeBoolean(options.onGround);

        return this;
    }

    readPlayerPositionAndLook() : PlayerPositionAndLook {
        let x = this.readDouble();
        let y = this.readDouble();
        let stance = this.readDouble();
        let z = this.readDouble();
        let yaw = this.readFloat();
        let pitch = this.readFloat();
        let onGround = this.readBoolean();

        return {position: new Vec3(x, y, z), stance, yaw, pitch, onGround};
    }

	readAscii() : string {
		return this.readShortPacket().toString("ascii");
	}
}
