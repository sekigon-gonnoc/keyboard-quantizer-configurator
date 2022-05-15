export class EeConfigKeyboard {
  readonly override: number = 0;
  readonly enableOs: boolean = false;
  readonly enableCombo: boolean = false;
  readonly tappingTerm20ms: number = 0;
  readonly parserType: number = 0;

  constructor(init?: Partial<EeConfigKeyboard>) {
    Object.assign(this, init);
  }

  public IncrementTappingTerm(): EeConfigKeyboard {
    return new EeConfigKeyboard({
      ...this,
      tappingTerm20ms: Math.min(this.tappingTerm20ms + 20, 340),
    });
  }

  public DecrementTappingTerm(): EeConfigKeyboard {
    return new EeConfigKeyboard({
      ...this,
      tappingTerm20ms: Math.max(this.tappingTerm20ms - 20, 60),
    });
  }

  public static Deserialize(data: number[]): EeConfigKeyboard {
    const tapterm = (data[0] & 0xf0) >> 4;
    return new EeConfigKeyboard({
      enableOs: (data[0] & 0x01) > 0,
      override: (data[0] & 0x06) >> 1,
      enableCombo: (data[0] & 0x08) > 0,
      tappingTerm20ms: tapterm == 0 ? 200 : tapterm * 20 + 40,
      parserType: data[1] & 0x01,
    });
  }

  public static Serialize(config: EeConfigKeyboard) {
    return [
      (config.enableOs ? 0x01 : 0) |
        ((config.override & 0x03) << 1) |
        (config.enableCombo ? 0x08 : 0) |
        ((((config.tappingTerm20ms - 60) / 10) & 0x0f) << 4),
      config.parserType & 0x01,
      0,
    ];
  }
}

export class EeConfigUser {
  readonly mouse_gesture: number = 0;
  constructor(init?: Partial<EeConfigUser>) {
    Object.assign(this, init);
  }

  public IncrementMouseGesture(): EeConfigUser {
    return new EeConfigUser({
      ...this,
      mouse_gesture: Math.min(this.mouse_gesture + 10, 150),
    });
  }

  public DecrementMouseGesture(): EeConfigUser {
    return new EeConfigUser({
      ...this,
      mouse_gesture: Math.max(this.mouse_gesture - 10, 10),
    });
  }
  public static Deserialize(data: number[]): EeConfigUser {
    const d = data[0] & 0x0f;
    return new EeConfigUser({
      mouse_gesture: d == 0 ? 50 : d * 10,
    });
  }

  public static Serialize(config: EeConfigUser) {
    return [(config.mouse_gesture / 10) & 0x0f, 0, 0, 0];
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
  readonly user: EeConfigUser;
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
    this.keyboard = EeConfigKeyboard.Deserialize(d.slice(15, 19));
    this.user = EeConfigUser.Deserialize(d.slice(19, 23));
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
      ...EeConfigUser.Serialize(config.user),
      config.velocikey,
      ...config.haptic,
      ...config.rgbmatrix,
      ...config.rgbmatrixExtend,
      config.keymap >> 8,
    ];
  }
}
