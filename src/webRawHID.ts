import { WebUsbComInterface } from "./webUsbComInterface";

class WebRawHID implements WebUsbComInterface {
  private receiveCallback: ((msg: Uint8Array) => void) | null = null;
  private openCallback: (() => void) | null = null;
  private closeCallback: (() => void) | null = null;
  private errorCallback: ((e: Error) => void) | null = null;

  private port: any | null = null;

  private _connected: boolean = false;
  get connected() {
    return this._connected;
  }

  constructor(
    private send_chunk: number = 64,
    private send_interval: number = 30
  ) {
    (navigator as any).hid.addEventListener("disconnect", (_device: any) => {
      this._connected = false;
    });
  }

  setReceiveCallback(recvHandler: ((msg: Uint8Array) => void) | null) {
    this.receiveCallback = (e: any) => {
      recvHandler?.(new Uint8Array((e.data as DataView).buffer));
    };
    this.port.addEventListener("inputreport", this.receiveCallback);
    console.log(this.port);
  }
  setErrorCallback(handler: (e: Error) => void | null) {
    this.errorCallback = handler;
  }
  setCloseCallback(handler: () => void | null) {
    this.closeCallback = handler;
  }

  async open(onConnect: () => void | null, param: { filter: object }) {
    const request = await (navigator as any).hid.requestDevice({
      filters: param.filter,
    });
    console.log(request);
    this.port = request[0];

    if (!this.port) {
      return;
    }

    try {
      await this.port.open();
    } catch (e) {
      await this.port?.close();
      return Promise.reject(e);
    }

    this._connected = true;

    if (onConnect) {
      onConnect();
    }

    // this.readLoop();

    console.log("open Raw HID port");
  }

  async writeString(msg: string) {
    this.port.sendReport(0, msg);
  }

  async write(msg: Uint8Array) {
    console.log(
      `send: ${Array.from(msg)
        .map((v) => v.toString(16))
        .join(" ")}`
    );
    this.port.sendReport(0, msg);
  }

  async close() {
    if (this.closeCallback) {
      this.closeCallback();
    }

    if (this.port) {
      try {
        this.port.removeEventListener("inputreport", this.receiveCallback);
        await this.port.close();
        this.port = null;
        // this._connected = false;
      } catch (e) {
        console.error(e);
      }
    }

    console.log("Raw HID port closed");
  }
}

export { WebRawHID };
