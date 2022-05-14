import { useState, Fragment } from "react";
import { EeConfig } from "./EeConfig";

export interface IEeconfigProps {
  config: EeConfig;
}

export function EeConfigEditor(props: IEeconfigProps) {
  return (
    <Fragment>
      <div>DefaultLayer:{props.config.defaultLayer}</div>
      <div>Keymap:{props.config.keymap.toString()}</div>
      <div>Keyboard:{props.config.keyboard.toString()}</div>
      <div>User:{props.config.user.toString()}</div>
      <div>Keymap:{props.config.keymap.toString()}</div>
    </Fragment>
  );
}
