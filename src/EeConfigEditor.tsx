import { useState, Fragment } from "react";
import { EeConfig, EeConfigKeyboard } from "./EeConfig";

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
            const newConfig = {
              ...props.config,
              override: Number(e.target.value),
            };
            props.onChange(newConfig);
          }}
          value={props.config.override}
        >
          <option value={0}>Disable</option>
          <option value={1}>JP</option>
          <option value={2}>US</option>
        </select>
      </label>
      <label>
        Combo
        <input
          type="checkbox"
          checked={props.config.enableCombo}
          onChange={(e) => {
            const newConfig = {
              ...props.config,
              enableCombo: e.target.checked,
            };
            props.onChange(newConfig);
          }}
        ></input>
      </label>
      <label>
        Tapping term
        <input
          type="number"
          min={0}
          max={320}
          step={20}
          value={props.config.tappingTerm10ms * 10}
          onChange={(e) => {
            const newConfig = {
              ...props.config,
              tappingTerm10ms: Math.round(Number(e.target.value) / 10),
            };
            props.onChange(newConfig);
          }}
        ></input>
      </label>
    </Fragment>
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
      <div>Keymap:{props.config.keymap.toString()}</div>
      <KeyboardConfig
        config={props.config.keyboard}
        onChange={(v) => {
          const newConfig = { ...props.config, keyboard: v };
          props.onChange(newConfig);
        }}
      />
      <div>User:{props.config.user.toString()}</div>
    </Fragment>
  );
}
