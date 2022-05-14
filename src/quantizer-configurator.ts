import { WebRawHID } from "./webRawHID";
import { EeConfig } from "./EeConfig";

// enum via_keyboard_value_id_kb { id_keyboard_quantizer = 0x99 };

// enum via_kq_value_id_kb {
//     id_config_ver = 0x01,
//     id_bootloader,
//     id_reset,
//     id_eeprom,  // read/write eeprom
// };

let hid = new WebRawHID();

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

  public Parse() {
    const active = new EeConfig(this.data);
    const win = new EeConfig(this.data.slice(this.EECONFIG_SIZE));
    const mac = new EeConfig(this.data.slice(this.EECONFIG_SIZE * 2));
    const linux = new EeConfig(this.data.slice(this.EECONFIG_SIZE * 3));
    console.log(active, win, mac, linux);
    return { active: active, win: win, mac: mac, linux: linux };
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
    const config = eepromConfig.Parse();
    onReceive(config);
  });
}
