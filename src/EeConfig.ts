export class EeConfigKeyboard {
  readonly override: number = 0;
  readonly enableOs: boolean = false;
  readonly enableCombo: boolean = false;
  readonly tappingTerm10ms: number = 0;

  constructor(data: number[]) {
    if (data.length >= 1) {
      this.enableOs = (data[0] & 0x01) > 0;
      this.override = (data[0] & 0x06) >> 1;
      this.enableCombo = (data[0] & 0x08) > 0;
    }

    if (data.length >= 2) {
        this.tappingTerm10ms=data[1];
    }
  }

  public static Serialize(config: EeConfigKeyboard) {
    return [
      (config.enableOs ? 0x01 : 0) |
        ((config.override & 0x03) << 1) |
        (config.enableCombo ? 0x08 : 0),
      config.tappingTerm10ms,
      0,
      0,
    ];
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
  readonly rgbmatrixExtend: number[];

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
    this.rgbmatrixExtend = d.slice(32, 34);
  }

  public static Serialize(config: EeConfig): number[] {
    return [
      config.magic & 0xff,
      config.magic >> 8,
      config.debug,
      config.defaultLayer,
      config.keymap & 0xff,
      config.mouseKeyAccel,
      config.backlight,
      config.audio,
      ...config.rgblight,
      config.unicode,
      config.stenomode,
      config.handedness,
      ...EeConfigKeyboard.Serialize(config.keyboard),
      ...config.user,
      config.velocikey,
      ...config.haptic,
      ...config.rgbmatrix,
      ...config.rgbmatrixExtend,
      config.keymap >> 8,
    ];
  }
}
