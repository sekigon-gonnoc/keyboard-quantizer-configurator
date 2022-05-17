import { Fragment, isValidElement, useState } from "react";
import {
  jumpBootloaderTarget,
  readEeConfig,
  writeEeConfig,
  IQuantizerConfig,
} from "./quantizer-configurator";
import { EeConfig, EeConfigKeyboard } from "./EeConfig";
import { EeConfigEditor } from "./EeConfigEditor";
import "./app.css";

function App() {
  const [config, setConfig] = useState<IQuantizerConfig | undefined>(undefined);
  const [btnDisable, setBtnDisable] = useState(false);

  const editor = () => {
    if (!config) {
      return;
    }

    if (config.eeconfig.active.keyboard.enableOs) {
      return (
        <Fragment>
          <EeConigEnableOs enabled={true} />
          {Object.entries(config.eeconfig).map((e) => {
            const label = e[0];
            if (label === config.currentOs) return;

            return (
              <Fragment key={label}>
                <h3>
                  OS Type:{" "}
                  {label === "active" ? `${config.currentOs}(active)` : label}
                </h3>
                <EeConfigEditor
                  config={e[1]}
                  onChange={(newConfig) => {
                    setConfig({
                      ...config,
                      eeconfig: { ...config.eeconfig, [label]: newConfig },
                    });
                    console.log(newConfig);
                  }}
                />
              </Fragment>
            );
          })}
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          <EeConigEnableOs enabled={false} />
          <EeConfigEditor
            config={config.eeconfig.active}
            onChange={(newConfig) => {
              setConfig({
                ...config,
                eeconfig: { ...config.eeconfig, active: newConfig },
              });
              console.log(newConfig);
            }}
          />
        </Fragment>
      );
    }
  };

  const EeConigEnableOs = (props: { enabled: boolean }) => {
    if (!config) return <Fragment />;

    return (
      <div>
        <label>
          <input
            type="checkbox"
            checked={props.enabled}
            onChange={(e) => {
              const newConfig = Object.assign(
                {},
                ...Object.entries(config.eeconfig).map(([key, val]) => {
                  const baseConfig =
                    val.magic == 0xfee9 ? val : config.eeconfig.active;
                  return {
                    [key]: new EeConfig({
                      ...baseConfig,
                      keyboard: new EeConfigKeyboard({
                        ...baseConfig.keyboard,
                        enableOs: e.target.checked,
                      }),
                    }),
                  };
                })
              );
              console.log(newConfig);
              console.log({
                ...config,
                eeconfig: { ...config.eeconfig, ...newConfig },
              });
              setConfig({
                ...config,
                eeconfig: { ...config.eeconfig, ...newConfig },
              });
            }}
          ></input>
          Enable per host OS config
        </label>
      </div>
    );
  };

  return (
    <div className="App">
      <div>
        <button
          className="primary"
          disabled={btnDisable}
          onClick={() => {
            setBtnDisable(true);
            readEeConfig(
              (c) => setConfig(c),
              () => {
                setBtnDisable(false);
              }
            );
          }}
        >
          Read
        </button>
        <button
          disabled={btnDisable}
          className="primary"
          onClick={() => {
            if (!config) {
              return;
            }
            setBtnDisable(true);
            writeEeConfig(
              config,
              (c) => setConfig(c),

              () => {
                setBtnDisable(false);
              }
            );
          }}
        >
          Write
        </button>
        <button
          disabled={btnDisable}
          className="primary"
          onClick={() => {
            jumpBootloaderTarget();
          }}
        >
          Jump to bootloader
        </button>
      </div>
      {editor()}
    </div>
  );
}

export default App;
