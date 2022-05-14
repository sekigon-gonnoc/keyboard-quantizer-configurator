export class EeConfigKeyboard {
  readonly override: number = 0;
  readonly enableOs: boolean = false;
  readonly enableCombo: boolean = false;
  constructor(data: number[]) {
    if (data.length >= 1) {
        this.override = data[0] & 0x03;
        this.enableOs = (data[0] & 0x04) > 0;
        this.enableCombo = (data[0] & 0x08) > 0;
    }
  }
}

export class EeConfig {
  readonly magic: number;
  readonly debug: number;
  readonly defaultLayer: number;
  readonly keymap: number;
  readonly mouseKeyAccel: number;
  readonly backlight: number;
  readonly audio: number;
  readonly rgblight: number[];
  readonly unicode: number;
  readonly stenomode: number;
  readonly handedness: number;
  readonly keyboard: EeConfigKeyboard;
  readonly user: number[];
  readonly velocikey: number;
  readonly haptic: number[];
  readonly rgbmatrix: number[];

  constructor(d: number[]) {
    this.magic = d[0] | (d[1] << 8);
    this.debug = d[2];
    this.defaultLayer = d[3];
    this.keymap = d[4] | (d[34] << 8);
    this.mouseKeyAccel = d[5];
    this.backlight = d[6];
    this.audio = d[7];
    this.rgblight = d.slice(8, 12);
    this.unicode = d[12];
    this.stenomode = d[13];
    this.handedness = d[14];
    this.keyboard = new EeConfigKeyboard(d.slice(15, 19));
    this.user = d.slice(19, 23);
    this.velocikey = d[23];
    this.haptic = d.slice(24, 28);
    this.rgbmatrix = d.slice(28, 32);
  }
}
