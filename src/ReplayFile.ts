namespace ReplayViewRSC {
    export enum GlobalStyle {
        Normal = 0,
        SW = 1,
        HSW = 2,
        BW = 3,
        LG = 4,
        SM = 5,
        FFW = 6,
        FS = 7
    }

    export enum Button {
        Attack = 1 << 0,
        Jump = 1 << 1,
        Duck = 1 << 2,
        Forward = 1 << 3,
        Back = 1 << 4,
        Use = 1 << 5,
        Cancel = 1 << 6,
        Left = 1 << 7,
        Right = 1 << 8,
        MoveLeft = 1 << 9,
        MoveRight = 1 << 10,
        Attack2 = 1 << 11,
        Run = 1 << 12,
        Reload = 1 << 13,
        Alt1 = 1 << 14,
        Alt2 = 1 << 15,
        Score = 1 << 16,
        Speed = 1 << 17,
        Walk = 1 << 18,
        Zoom = 1 << 19,
        Weapon1 = 1 << 20,
        Weapon2 = 1 << 21,
        BullRush = 1 << 22,
        Grenade1 = 1 << 23,
        Grenade2 = 1 << 24
    }

    export class TickData {
        readonly position = new Facepunch.Vector3();
        readonly velocity = new Facepunch.Vector3();
        readonly angles = new Facepunch.Vector2();
        tick = -1;
        buttons: Button = 0;

        getEyeHeight(): number {
            return (this.buttons & Button.Duck) != 0 ? 46 : 64;
        }
    }

    export class ReplayFile {
        static readonly MAGIC = 0xBAADF00D;

        private readonly reader: BinaryReader;
        private readonly firstTickOffset: number;
        private readonly tickSize: number;

        readonly formatVersion: number;

        readonly mapName: string;
        readonly style: GlobalStyle;
        readonly time: string;
        readonly playerName: string;
        readonly tickCount: number;
        readonly tickRate: number;

        constructor(data: ArrayBuffer, fileName: string) {
            const reader = this.reader = new BinaryReader(data);

            const magic = reader.readUint32();
            if (magic !== ReplayFile.MAGIC) {
                throw "Unknown replay file format!";
            }

            this.formatVersion = reader.readUint8();

            this.mapName = fileName.substring(fileName.search(/surf_/g), fileName.search(/_bonus_/g) != -1 ? fileName.search(/_bonus_/g) : (fileName.search(/_stage_/g) != -1 ? fileName.search(/_stage_/g) : (fileName.search(/_style_/g) != -1 ? fileName.search(/_style_/g) : fileName.search(/.rec/g))));
            this.style = (fileName.search(/_style_/g) != -1 ? parseInt(fileName.substring(fileName.search(/_style_/g) + 7, fileName.search(/_style_/g) + 8)) : 0) as GlobalStyle;
            this.time = reader.readString();
            this.playerName = reader.readString();

            reader.moveOffset(24);

            this.tickCount = reader.readInt32();
            if (fileName.search(/\/66tick\//g) != -1)
                this.tickRate = 66;
            else if (fileName.search(/\/85tick\//g) != -1)
                this.tickRate = 85;
            else
                throw "Invalid tickrate!";

            this.firstTickOffset = reader.getOffset();
            this.tickSize = 80;
        }

        getTickData(tick: number, data?: TickData): TickData {
            if (data === undefined) data = new TickData();

            data.tick = tick;

            const reader = this.reader;
            reader.seek(this.firstTickOffset + this.tickSize * tick, SeekOrigin.Begin);

            data.buttons = reader.readInt32();
            reader.moveOffset(4);
            reader.readVector3(data.velocity);
            reader.moveOffset(12);
            reader.readVector2(data.angles);
            reader.readVector3(data.position);

            return data;
        }

        clampTick(tick: number): number {
            return tick < 0 ? 0 : tick >= this.tickCount ? this.tickCount - 1 : tick;
        }
    }
}
