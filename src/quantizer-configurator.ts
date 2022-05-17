import { WebRawHID } from "./webRawHID";
import { EeConfig } from "./EeConfig";
class ProcessQueue {
  queue: Array<{ header: Uint8Array; process: (msg: Uint8Array) => void }> = [];
  public Push(header: Uint8Array, process: (msg: Uint8Array) => void) {
    this.queue.push({ header: header, process: process });
  }

  public Process(msg: Uint8Array) {
    const p = this.queue.at(0);
    if (p?.header.toString() === msg.slice(0, p?.header.length).toString()) {
      p.process(msg);
      this.queue.shift();
    }
  }
}

class QuantizerConfig {
  static readonly EECONFIG_SIZE = 35;
  data: Array<number> = [];
  protocolVersion = 0;
  hostOs = 0;

  public SetFragment(offset: number, size: number, fragment: Uint8Array) {
    for (let idx = 0; idx < size; idx++) {
      this.data[offset + idx] = fragment[idx];
    }
  }

  public Deserialize(): IQuantizerConfig {
    const active = EeConfig.Deserialize(this.data);
    const win = EeConfig.Deserialize(
      this.data.slice(QuantizerConfig.EECONFIG_SIZE)
    );
    const mac = EeConfig.Deserialize(
      this.data.slice(QuantizerConfig.EECONFIG_SIZE * 2)
    );
    const linux = EeConfig.Deserialize(
      this.data.slice(QuantizerConfig.EECONFIG_SIZE * 3)
    );
    console.log(active, win, mac, linux);
    return {
      protocolVer: this.protocolVersion,
      currentOs:
        this.hostOs == 1
          ? "win"
          : this.hostOs == 2
          ? "mac"
          : this.hostOs == 3
          ? "linux"
          : "unknown",
      eeconfig: {
        active: active,
        win: win,
        mac: mac,
        linux: linux,
      },
    };
  }

  private serializeFragment(eeconfig: EeConfig) {
    console.log(eeconfig);
    const data = EeConfig.Serialize(eeconfig);
    if (data.length != QuantizerConfig.EECONFIG_SIZE) {
      throw new Error(`failed to serialize. Invalid length ${data.length}`);
    }
    return data;
  }

  public Serialize(eeconfig: IQuantizerConfig) {
    return [
      ...this.serializeFragment(eeconfig.eeconfig.active),
      ...this.serializeFragment(eeconfig.eeconfig.win),
      ...this.serializeFragment(eeconfig.eeconfig.mac),
      ...this.serializeFragment(eeconfig.eeconfig.linux),
    ];
  }
}

class QuantizerCommand {
  private readonly EEPROM_RW_LEN = 26;

  private readonly hid = new WebRawHID();
  private readonly processQueue = new ProcessQueue();
  private readonly eepromConfig = new QuantizerConfig();

  public readonly ReadEeConfig = async (
    onReceive: (msg: IQuantizerConfig) => void
  ) => {
    await this.getEeprom(
      0,
      QuantizerConfig.EECONFIG_SIZE * 4,
      (_: Uint8Array) => {
        const config = this.eepromConfig.Deserialize();
        onReceive(config);
      }
    );
  };

  public readonly WriteEeConfig = async (
    config: IQuantizerConfig,
    onReceive: (config: IQuantizerConfig) => void
  ) => {
    const data = this.eepromConfig.Serialize(config);

    await this.setEeprom(0, 130, data, (msg) => {
      console.log("write complete");
      readEeConfig((c) => {
        onReceive(c);
        this.resetTarget();
      });
    });
  };

  public readonly GetVersion = async (
    onReceive: (msg: Uint8Array) => void = () => {}
  ) => {
    const cmd = this.versionCommand();
    this.processQueue.Push(cmd, (msg) => {
      this.eepromConfig.protocolVersion = msg[3];
      console.log(`protocol ver.:${this.eepromConfig.protocolVersion}`);
      onReceive(msg);
    });
    await this.write(cmd);
  };

  public readonly GetHostOs = async (
    onReceive: (msg: Uint8Array) => void = () => {}
  ) => {
    const cmd = this.hostOsCommand();
    this.processQueue.Push(cmd, (msg) => {
      this.eepromConfig.hostOs = msg[3];
      console.log(`host os:${this.eepromConfig.hostOs}`);
      onReceive(msg);
    });
    await this.write(cmd);
  };

  public readonly JumpBootloader = async () => {
    const cmd = this.bootloaderCommand();
    await this.write(cmd);
  };

  private readonly resetTarget = async () => {
    const cmd = this.resetCommand();
    await this.write(cmd);
  };

  private readonly write = async (cmd: Uint8Array) => {
    await this.open();
    await this.hid.write(cmd);
  };

  private readonly open = async () => {
    if (this.hid.connected) return;

    if (!(navigator as any).hid) {
      alert("Please use chrome or edge");
      return;
    }
    await this.hid.open(() => {}, {
      filter: [{ usagePage: 0xff60, usage: 0x61 }],
    });

    this.hid.setReceiveCallback(this.recvHandler);
  };

  private readonly recvHandler = (msg: Uint8Array) => {
    console.log(
      `recv: ${Array.from(msg)
        .map((v: number) => v.toString(16))
        .join(" ")}`
    );

    this.processQueue.Process(msg);
  };

  private readonly getEepromFragment = async (
    offset: number,
    onReceive: (msg: Uint8Array) => void = () => {}
  ) => {
    const cmd = this.eepromReadCommand(offset, this.EEPROM_RW_LEN);
    this.processQueue.Push(cmd, (msg) => {
      this.eepromConfig.SetFragment(
        (msg[3] << 8) | msg[4],
        msg[5],
        msg.slice(6)
      );
      onReceive(msg);
    });
    await this.write(cmd);
  };

  private readonly getEeprom = async (
    offset: number,
    length: number,
    onReceive: (msg: Uint8Array) => void
  ) => {
    const bulkCnt = Math.ceil(length / this.EEPROM_RW_LEN);
    for (let idx = 0; idx < bulkCnt - 1; idx++) {
      this.getEepromFragment(offset + this.EEPROM_RW_LEN * idx);
    }
    this.getEepromFragment(
      offset + this.EEPROM_RW_LEN * (bulkCnt - 1),
      onReceive
    );
  };

  private readonly setEepromFragment = async (
    offset: number,
    data: number[],
    onReceive: (msg: Uint8Array) => void = () => {}
  ) => {
    const cmd = this.eepromWriteCommand(offset, this.EEPROM_RW_LEN, data);

    this.processQueue.Push(cmd, (msg) => {
      onReceive(msg);
    });
    await this.write(cmd);
  };

  private readonly setEeprom = async (
    offset: number,
    length: number,
    data: number[],
    onReceive: (msg: Uint8Array) => void
  ) => {
    const bulkCnt = Math.ceil(length / this.EEPROM_RW_LEN);
    for (let idx = 0; idx < bulkCnt - 1; idx++) {
      this.setEepromFragment(
        offset + this.EEPROM_RW_LEN * idx,
        data.slice(this.EEPROM_RW_LEN * idx)
      );
    }
    this.setEepromFragment(
      offset + this.EEPROM_RW_LEN * (bulkCnt - 1),
      data.slice(this.EEPROM_RW_LEN * (bulkCnt - 1)),
      onReceive
    );
  };

  private readonly eepromReadCommand = (addr: number, size: number) => {
    if (size > 26) size = 26;
    return Uint8Array.from([
      0x02,
      0x99,
      0x04,
      (addr >> 8) & 0xff,
      addr & 0xff,
      size,
    ]);
  };

  private readonly eepromWriteCommand = (
    addr: number,
    size: number,
    data: number[]
  ) => {
    if (size > 26) size = 26;
    if (size > data.length) size = data.length;

    return Uint8Array.from([
      0x03,
      0x99,
      0x04,
      (addr >> 8) & 0xff,
      addr & 0xff,
      size,
      ...data.slice(0, size),
    ]);
  };

  private readonly versionCommand = () => {
    return Uint8Array.from([0x02, 0x99, 0x01]);
  };

  private readonly bootloaderCommand = () => {
    return Uint8Array.from([0x03, 0x99, 0x02]);
  };

  private readonly resetCommand = () => {
    return Uint8Array.from([0x03, 0x99, 0x03]);
  };

  private readonly hostOsCommand = () => {
    return Uint8Array.from([0x02, 0x99, 0x05]);
  };
}

const quantizer = new QuantizerCommand();

export interface IQuantizerConfig {
  protocolVer: number;
  currentOs: "unknown" | "win" | "mac" | "linux";
  eeconfig: {
    active: EeConfig;
    win: EeConfig;
    mac: EeConfig;
    linux: EeConfig;
  };
}

export async function readEeConfig(
  onReceive: (config: IQuantizerConfig) => void
) {
  await quantizer.GetVersion();
  await quantizer.GetHostOs();
  await quantizer.ReadEeConfig(onReceive);
}

export async function writeEeConfig(
  config: IQuantizerConfig,
  onReceive: (config: IQuantizerConfig) => void
) {
  await quantizer.WriteEeConfig(config, onReceive);
}

export async function jumpBootloaderTarget() {
  await quantizer.JumpBootloader();
}
