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
        ((((config.tappingTerm20ms - 40) / 20) & 0x0f) << 4),
      config.parserType & 0x01,
      0,
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

export class EeConfigKeymap {
  readonly swap_control_capslock: boolean = false;
  readonly capslock_to_control: boolean = false;
  readonly swap_lalt_lgui: boolean = false;
  readonly swap_ralt_rgui: boolean = false;
  readonly no_gui: boolean = false;
  readonly swap_grave_esc: boolean = false;
  readonly swap_backslash_backspace: boolean = false;
  readonly nkro: boolean = false;
  readonly swap_lctl_lgui: boolean = false;
  readonly swap_rctl_rgui: boolean = false;
  readonly oneshot_disable: boolean = false;

  constructor(init?: Partial<EeConfigKeymap>) {
    Object.assign(this, init);
  }

  public static Deserialize(data: number): EeConfigKeymap {
    return new EeConfigKeymap({
      swap_control_capslock: Boolean(data & 0x01),
      capslock_to_control: Boolean(data & 0x02),
      swap_lalt_lgui: Boolean(data & 0x04),
      swap_ralt_rgui: Boolean(data & 0x08),
      no_gui: Boolean(data & 0x10),
      swap_grave_esc: Boolean(data & 0x20),
      swap_backslash_backspace: Boolean(data & 0x40),
      nkro: Boolean(data & 0x80),
      swap_lctl_lgui: Boolean(data & 0x100),
      swap_rctl_rgui: Boolean(data & 0x200),
      oneshot_disable: Boolean(data & 0x400),
    });
  }

  public static Serialize(config: EeConfigKeymap) {
    return (
      (config.swap_control_capslock ? 0x01 : 0) |
      (config.capslock_to_control ? 0x02 : 0) |
      (config.swap_lalt_lgui ? 0x04 : 0) |
      (config.swap_ralt_rgui ? 0x08 : 0) |
      (config.no_gui ? 0x10 : 0) |
      (config.swap_grave_esc ? 0x20 : 0) |
      (config.swap_backslash_backspace ? 0x40 : 0) |
      (config.nkro ? 0x80 : 0) |
      (config.swap_lctl_lgui ? 0x100 : 0) |
      (config.swap_rctl_rgui ? 0x200 : 0) |
      (config.oneshot_disable ? 0x400 : 0)
    );
  }
}

export class EeConfig {
  readonly magic: number = 0;
  readonly debug: number = 0;
  readonly defaultLayer: number = 0;
  readonly keymap = EeConfigKeymap.Deserialize(0);
  readonly mouseKeyAccel: number = 0;
  readonly backlight: number = 0;
  readonly audio: number = 0;
  readonly rgblight: number[] = [0, 0, 0, 0];
  readonly unicode: number = 0;
  readonly stenomode: number = 0;
  readonly handedness: number = 0;
  readonly keyboard = EeConfigKeyboard.Deserialize([0, 0, 0, 0]);
  readonly user = EeConfigUser.Deserialize([0, 0, 0, 0]);
  readonly velocikey: number = 0;
  readonly haptic: number[] = [0, 0, 0, 0];
  readonly rgbmatrix: number[] = [0, 0, 0, 0];
  readonly rgbmatrixExtend: number[] = [0, 0, 0, 0];

  constructor(init?: Partial<EeConfig>) {
    Object.assign(this, init);
  }

  public static Deserialize(d: number[]): EeConfig {
    let defaultLayer = 0;
    for (let idx = 0; idx < 8; idx++) {
      if (d[3] & (1 << idx)) {
        defaultLayer = idx;
        break;
      }
    }

    return new EeConfig({
      magic: d[0] | (d[1] << 8),
      debug: d[2],
      defaultLayer: defaultLayer,
      keymap: EeConfigKeymap.Deserialize(d[4] | (d[34] << 8)),
      mouseKeyAccel: d[5],
      backlight: d[6],
      audio: d[7],
      rgblight: d.slice(8, 12),
      unicode: d[12],
      stenomode: d[13],
      handedness: d[14],
      keyboard: EeConfigKeyboard.Deserialize(d.slice(15, 19)),
      user: EeConfigUser.Deserialize(d.slice(19, 23)),
      velocikey: d[23],
      haptic: d.slice(24, 28),
      rgbmatrix: d.slice(28, 32),
      rgbmatrixExtend: d.slice(32, 34),
    });
  }

  public static Serialize(config: EeConfig): number[] {
    const keymap = EeConfigKeymap.Serialize(config.keymap);
    return [
      config.magic & 0xff,
      config.magic >> 8,
      config.debug,
      (1 << config.defaultLayer) & 0xff,
      keymap & 0xff,
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
      keymap >> 8,
    ];
  }
}
