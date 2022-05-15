import { useState, Fragment } from "react";
import { EeConfig, EeConfigKeyboard, EeConfigUser } from "./EeConfig";

export interface IEeconfigProps {
  config: EeConfig;
  onChange: (c: EeConfig) => void;
}

function KeyboardConfig(props: {
  config: EeConfigKeyboard;
  onChange: (v: EeConfigKeyboard) => void;
}) {
  return (
    <Fragment>
      <label>
        KeyOverride
        <select
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
        Combo
        <input
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
      <div>
        Tapping term: {props.config.tappingTerm20ms} ms
        <button
          onClick={() => {
            props.onChange(props.config.IncrementTappingTerm());
          }}
        >
          +
        </button>
        <button
          onClick={() => {
            props.onChange(props.config.DecrementTappingTerm());
          }}
        >
          -
        </button>
      </div>
    </Fragment>
  );
}

function UserConfig(props: {
  config: EeConfigUser;
  onChange: (v: EeConfigUser) => void;
}) {
  return (
    <div>
      Mouse gesture: {props.config.mouse_gesture} px
      <button
        onClick={() => {
          props.onChange(props.config.IncrementMouseGesture());
        }}
      >
        +
      </button>
      <button
        onClick={() => {
          props.onChange(props.config.DecrementMouseGesture());
        }}
      >
        -
      </button>
    </div>
  );
}

export function EeConfigEditor(props: IEeconfigProps) {
  return (
    <Fragment>
      <label>
        DefaultLayer:
        <input
          type="number"
          min={0}
          max={32}
          value={props.config.defaultLayer}
          onChange={(e) => {
            const newConfig = {
              ...props.config,
              defaultLayer: Number(e.target.value),
            };
            props.onChange(newConfig);
          }}
        ></input>
      </label>
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
    </Fragment>
  );
}
