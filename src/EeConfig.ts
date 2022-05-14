
export class EeConfig {
  readonly magic: number;
  readonly debug: number;
  readonly defaultLayer: number;
  readonly keymap: number[];
  readonly mouseKeyAccel: number;
  readonly backlight: number;
  readonly audio: number;
  readonly rgblight: number[];
  readonly unicode: number;
  readonly stenomode: number;
  readonly handedness: number;
  readonly keyboard: number[];
  readonly user: number[];
  readonly velocikey: number;
  readonly haptic: number[];
  readonly rgbmatrix: number[];

  constructor(d: number[]) {
    this.magic = d[0] | (d[1] << 8);
    this.debug = d[2];
    this.defaultLayer = d[3];
    this.keymap = [d[4], ...d.slice(34, 36)];
    this.mouseKeyAccel = d[5];
    this.backlight = d[6];
    this.audio = d[7];
    this.rgblight = d.slice(8, 12);
    this.unicode = d[12];
    this.stenomode = d[13];
    this.handedness = d[14];
    this.keyboard = d.slice(15, 19);
    this.user = d.slice(19, 23);
    this.velocikey = d[23];
    this.haptic = d.slice(24, 28);
    this.rgbmatrix = d.slice(28, 32);
  }
}