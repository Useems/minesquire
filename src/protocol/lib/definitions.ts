export class Definitions {
    private _idData: {[key: number]: string} = {};

    constructor(private _nameData: {[key: string]: number} = {}) {
        for (let i in this._nameData)
            this._idData[this._nameData[i]] = i;
    }

    getName(id: number) : (string | boolean) {
        return this._idData[id] != undefined ? this._idData[id] : false;
    }

    getId(name: string) : (number | boolean) {
        return this._nameData[name] != undefined ? this._nameData[name] : false;
    }
}