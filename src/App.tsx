import { Fragment, isValidElement, useState } from "react";
import {
  jumpBootloaderTarget,
  readEeConfig,
  writeEeConfig,
  IQuantizerConfig,
} from "./quantizer-configurator";
import { EeConfig, EeConfigKeyboard } from "./EeConfig";
import { EeConfigEditor } from "./EeConfigEditor";

function App() {
  const [eeconfig, setEeconfig] = useState<IQuantizerConfig | undefined>(
    undefined
  );

  const editor = () => {
    if (!eeconfig) {
      return;
    }

    if (eeconfig.eeconfig.active.keyboard.enableOs) {
      return (
        <Fragment>
          <EeConigEnableOs enabled={true} />
          {Object.entries(eeconfig.eeconfig).map((e) => {
            const label = e[0];
            return (
              <Fragment key={label}>
                <div>{label}</div>
                <EeConfigEditor
                  config={e[1]}
                  onChange={(newConfig) => {
                    setEeconfig({
                      ...eeconfig,
                      eeconfig: { ...eeconfig.eeconfig, [label]: newConfig },
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
            config={eeconfig.eeconfig.active}
            onChange={(newConfig) => {
              setEeconfig({
                ...eeconfig,
                eeconfig: { ...eeconfig.eeconfig, active: newConfig },
              });
              console.log(newConfig);
            }}
          />
        </Fragment>
      );
    }
  };

  const EeConigEnableOs = (props: { enabled: boolean }) => {
    if (!eeconfig) return <Fragment />;

    return (
      <div>
        <label>
          OS Config
          <input
            type="checkbox"
            checked={props.enabled}
            onChange={(e) => {
              const newConfig = Object.assign(
                {},
                ...Object.entries(eeconfig.eeconfig).map(([key, val]) => {
                  const baseConfig =
                    val.magic == 0xfee9 ? val : eeconfig.eeconfig.active;
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
                ...eeconfig,
                eeconfig: { ...eeconfig.eeconfig, ...newConfig },
              });
              setEeconfig({
                ...eeconfig,
                eeconfig: { ...eeconfig.eeconfig, ...newConfig },
              });
            }}
          ></input>
        </label>
      </div>
    );
  };

  return (
    <div className="App">
      <button onClick={() => readEeConfig((c) => setEeconfig(c))}>Read</button>
      <button
        onClick={() => {
          if (!eeconfig) {
            return;
          }
          writeEeConfig(eeconfig, (c) => setEeconfig(c));
        }}
      >
        Write
      </button>
      <button
        onClick={() => {
          jumpBootloaderTarget();
        }}
      >
        Jump to bootloader
      </button>
      {editor()}
    </div>
  );
}

export default App;
