import { WebRawHID } from "./webRawHID";
import { EeConfig } from "./EeConfig";

// enum via_keyboard_value_id_kb { id_keyboard_quantizer = 0x99 };

// enum via_kq_value_id_kb {
//     id_config_ver = 0x01,
//     id_bootloader,
//     id_reset,
//     id_eeprom,  // read/write eeprom
// };

const hid = new WebRawHID();

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

class EepromConfig {
  readonly EECONFIG_SIZE = 35;
  data: Array<number> = [];

  public SetFragment(offset: number, size: number, fragment: Uint8Array) {
    for (let idx = 0; idx < size; idx++) {
      this.data[offset + idx] = fragment[idx];
    }
  }

  public Deserialize() {
    const active = new EeConfig(this.data);
    const win = new EeConfig(this.data.slice(this.EECONFIG_SIZE));
    const mac = new EeConfig(this.data.slice(this.EECONFIG_SIZE * 2));
    const linux = new EeConfig(this.data.slice(this.EECONFIG_SIZE * 3));
    console.log(active, win, mac, linux);
    return { active: active, win: win, mac: mac, linux: linux };
  }

  private serializeFragment(eeconfig: EeConfig) {
    console.log(eeconfig);
    const data = EeConfig.Serialize(eeconfig);
    if (data.length != this.EECONFIG_SIZE) {
      console.log('failed to serialize', data.length);
    }
    return data;
  }

  public Serialize(eeconfig: { [os: string]: EeConfig }) {
    return [
      ...this.serializeFragment(eeconfig["active"]),
      ...this.serializeFragment(eeconfig["win"]),
      ...this.serializeFragment(eeconfig["mac"]),
      ...this.serializeFragment(eeconfig["linux"]),
    ];
  }
}

const processQueue = new ProcessQueue();
const eepromConfig = new EepromConfig();

const recvHandler = (msg: Uint8Array) => {
  console.log(
    `recv: ${Array.from(msg)
      .map((v: number) => v.toString(16))
      .join(" ")}`
  );

  processQueue.Process(msg);
};

const getEepromFragment = async (
  offset: number,
  onReceive: (msg: Uint8Array) => void = () => {}
) => {
  const cmd = eepromReadCommand(offset, 26);
  processQueue.Push(cmd, (msg) => {
    eepromConfig.SetFragment((msg[3] << 8) | msg[4], msg[5], msg.slice(6));
    onReceive(msg);
  });
  await hid.write(cmd);
};

const setEepromFragment = async (
  offset: number,
  data: number[],
  onReceive: (msg: Uint8Array) => void = () => {}
) => {
  const cmd = eepromWriteCommand(offset, 26, data);

  processQueue.Push(cmd, (msg) => {
    onReceive(msg);
  });
  await hid.write(cmd);
};

const hidOpen = async () => {
  if (!navigator.hid) {
    alert("Please use chrome or edge");
    return;
  }
  await hid.open(() => {}, {
    filter: [{ usagePage: 0xff60, usage: 0x61 }],
  });

  hid.setReceiveCallback(recvHandler);
};

const eepromReadCommand = (addr: number, size: number) => {
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

const eepromWriteCommand = (addr: number, size: number, data: number[]) => {
  if (size > 26) size = 26;
  if (size > data.length) size = data.length;

  return Uint8Array.from([
    0x03,
    0x99,
    0x04,
    (addr >> 8) & 0xff,
    addr & 0xff,
    size,
    ...data.slice(0, size)
  ]);
};

const versionCommand = () => {
  return Uint8Array.from([
    0x02,
    0x99,
    0x01,
  ]);
}

const bootloaderCommand = () => {
  return Uint8Array.from([
    0x03,
    0x99,
    0x02,
  ]);
}

const resetCommand = () => {
  return Uint8Array.from([
    0x03,
    0x99,
    0x03,
  ]);
}


export async function readEeConfig(
  onReceive: (config: { [OS: string]: EeConfig }) => void
) {
  if (hid.connected == false) {
    await hidOpen();
  }

  await getEepromFragment(0);
  await getEepromFragment(26);
  await getEepromFragment(52);
  await getEepromFragment(78);
  await getEepromFragment(104);
  await getEepromFragment(130, (_: Uint8Array) => {
    const config = eepromConfig.Deserialize();
    onReceive(config);
  });
}

export async function writeEeConfig(
  config: { [OS: string]: EeConfig },
  onReceive: (config: { [OS: string]: EeConfig }) => void
) {
  if (hid.connected == false) {
    await hidOpen();
  }

  const data = eepromConfig.Serialize(config);

  await setEepromFragment(0, data.slice(0, 26));
  await setEepromFragment(26, data.slice(26, 52));
  await setEepromFragment(52, data.slice(52, 78));
  await setEepromFragment(78, data.slice(78, 104));
  await setEepromFragment(104, data.slice(104, 130));
  await setEepromFragment(
    130,
    data.slice(130, 4 * eepromConfig.EECONFIG_SIZE),
    (msg) => {
      console.log("write complete");
      readEeConfig((c) => {
        onReceive(c);
        resetTarget();
      });
    }
  );
}

export async function getVersion(
  onReceive: (msg: Uint8Array) => void = () => {}
) {
  if (hid.connected == false) {
    await hidOpen();
  }

  const cmd = versionCommand();
  processQueue.Push(cmd, (msg) => {
    onReceive(msg);
  });
  await hid.write(cmd);
}

export async function jumpBootloaderTarget(){
  if (hid.connected == false) {
    await hidOpen();
  }

  const cmd = bootloaderCommand();
  await hid.write(cmd);
};

export async function resetTarget(){
  if (hid.connected == false) {
    await hidOpen();
  }

  const cmd = resetCommand();
  await hid.write(cmd);
};