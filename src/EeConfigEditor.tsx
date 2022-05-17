import { useState, Fragment, useRef, useEffect } from "react";
import {
  EeConfig,
  EeConfigKeyboard,
  EeConfigKeymap,
  EeConfigUser,
} from "./EeConfig";
import "./app.css";

export interface IEeconfigProps {
  config: EeConfig;
  onChange: (c: EeConfig) => void;
}

function NumericUpDown(props: {
  className: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const timer = useRef<{ up: number | undefined; down: number | undefined }>({
    up: undefined,
    down: undefined,
  });
  const propRef = useRef(props);
  useEffect(() => {
    propRef.current = props;
  });

  const clearUpTimer = () => {
    clearInterval(timer.current.up);
    timer.current.up = undefined;
  };

  const clearDownTimer = () => {
    clearInterval(timer.current.down);
    timer.current.down = undefined;
  };

  return (
    <Fragment>
      <div className={`${props.className} updown`}>
        <button
          onMouseDown={() => {
            props.onIncrement();
            if (!timer.current.up) {
              timer.current.up = setInterval(() => {
                propRef.current.onIncrement();
              }, 150);
            }
          }}
          onMouseUp={() => {
            clearUpTimer();
          }}
          onMouseLeave={() => {
            clearUpTimer();
          }}
        >
          +
        </button>
        <div>{props.value}</div>
        <button
          onMouseDown={() => {
            props.onDecrement();
            if (!timer.current.down) {
              timer.current.down = setInterval(() => {
                propRef.current.onDecrement();
              }, 150);
            }
          }}
          onMouseUp={() => {
            clearDownTimer();
          }}
          onMouseLeave={() => {
            clearDownTimer();
          }}
        >
          -
        </button>
      </div>
    </Fragment>
  );
}

function LayerConfig(props: { layer: number; onChange: (v: number) => void }) {
  return (
    <div className="layer-config">
      <div className="col-1">Default Layer (0-7)</div>
      <NumericUpDown
        className="col-2"
        value={props.layer.toString()}
        onIncrement={() => {
          if (props.layer < 7) props.onChange(props.layer + 1);
        }}
        onDecrement={() => {
          if (props.layer > 0) props.onChange(props.layer - 1);
        }}
      />
    </div>
  );
}

function KeyboardConfig(props: {
  config: EeConfigKeyboard;
  onChange: (v: EeConfigKeyboard) => void;
}) {
  return (
    <div className="keyboard-config">
      <label>
        <div className="col-1">Key Override</div>
        <select
          className="col-2"
          name="override"
          onChange={(e) => {
            const newConfig = new EeConfigKeyboard({
              ...props.config,
              override: Number(e.target.value),
            });
            props.onChange(newConfig);
          }}
          value={props.config.override}
        >
          <option value={0}>Disable</option>
          <option value={1}>US keyboard on JP OS</option>
          <option value={2}>JP keyboard on US OS</option>
        </select>
      </label>
      <label>
        <div className="col-1">Use last layer as Combo setting</div>
        <input
          className="col-2"
          type="checkbox"
          checked={props.config.enableCombo}
          onChange={(e) => {
            const newConfig = new EeConfigKeyboard({
              ...props.config,
              enableCombo: e.target.checked,
            });
            props.onChange(newConfig);
          }}
        ></input>
      </label>
      <div className="col-1">Tapping Term [ms]</div>
      <NumericUpDown
        className="col-2"
        value={props.config.tappingTerm20ms.toString()}
        onIncrement={() => {
          props.onChange(props.config.IncrementTappingTerm());
        }}
        onDecrement={() => {
          props.onChange(props.config.DecrementTappingTerm());
        }}
      />
    </div>
  );
}

function UserConfig(props: {
  config: EeConfigUser;
  onChange: (v: EeConfigUser) => void;
}) {
  return (
    <div className="user-config">
      <div className="col-1">Mouse Gesture [px]</div>
      <NumericUpDown
        className="col-2"
        value={props.config.mouse_gesture.toString()}
        onIncrement={() => {
          props.onChange(props.config.IncrementMouseGesture());
        }}
        onDecrement={() => {
          props.onChange(props.config.DecrementMouseGesture());
        }}
      />
    </div>
  );
}

function KeymapConfig(props: {
  config: EeConfigKeymap;
  onChange: (v: EeConfigKeymap) => void;
}) {
  const checkbox = (label: string, propName: keyof EeConfigKeymap) => {
    return (
      <div className="keymap-config">
        <label>
          <div className="col-1">{label}</div>
          <input
            className="col-2"
            type="checkbox"
            checked={props.config[propName]}
            onChange={(e) => {
              props.onChange(
                new EeConfigKeymap({
                  ...props.config,
                  [propName]: e.target.checked,
                })
              );
            }}
          ></input>
        </label>
      </div>
    );
  };

  return (
    <Fragment>
      {checkbox("Swap LALT LGUI", "swap_lalt_lgui")}
      {checkbox("Swap RALT RGUI", "swap_ralt_rgui")}
      {checkbox("Swap LCTL LGUI", "swap_lctl_lgui")}
      {checkbox("Swap RCTL RGUI", "swap_rctl_rgui")}
    </Fragment>
  );
}

export function EeConfigEditor(props: IEeconfigProps) {
  return (
    <div className="eeconfig-editor">
      <LayerConfig
        layer={props.config.defaultLayer}
        onChange={(v) => {
          const newConfig = { ...props.config, defaultLayer: v };
          props.onChange(newConfig);
        }}
      />
      <KeyboardConfig
        config={props.config.keyboard}
        onChange={(v) => {
          const newConfig = { ...props.config, keyboard: v };
          props.onChange(newConfig);
        }}
      />
      <UserConfig
        config={props.config.user}
        onChange={(v) => {
          const newConfig = { ...props.config, user: v };
          props.onChange(newConfig);
        }}
      />
      <KeymapConfig
        config={props.config.keymap}
        onChange={(v) => {
          const newConfig = { ...props.config, keymap: v };
          props.onChange(newConfig);
        }}
      />
    </div>
  );
}
