import { Fragment, useState } from "react";
import { readEeConfig } from "./quantizer-configurator";
import { EeConfig } from "./EeConfig";
import { EeConfigEditor } from "./EeConfigEditor";

function App() {
  const [eeconfig, setEeconfig] = useState<
    { [os: string]: EeConfig } | undefined
  >(undefined);

  const editor = () => {
    if (!eeconfig) { return ;}

      if (eeconfig['active'].keyboard.enableOs) {
        return (
          <Fragment>
            <EeConigEnableOs enabled={true} />
            {Object.entries(eeconfig).map((e) => {
              const label = e[0];
              return (
                <Fragment>
                  <div>{label}</div>
                  <EeConfigEditor
                    config={e[1]}
                    onChange={(newConfig) => {
                      setEeconfig({ ...eeconfig, [label]: newConfig });
                      console.log(newConfig);
                    }}
                  />
                </Fragment>
              );
            })}
          </Fragment>
        );
      } else {
        return(
          <Fragment>
            <EeConigEnableOs enabled={false} />
                  <EeConfigEditor
                    config={eeconfig['active']}
                    onChange={(newConfig) => {
                      setEeconfig({ ...eeconfig, active: newConfig });
                      console.log(newConfig);
                    }}
                  />
          </Fragment>
        );
      }
  };

  const EeConigEnableOs = (props: { enabled: boolean }) => {
    if (!eeconfig) return (<Fragment/>);

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
              ...Object.keys(eeconfig).map((key) => {
                const refkey = eeconfig[key].magic == 0xfee9 ? key : "active";
                return {
                  [key]: {
                    ...eeconfig[refkey],
                    keyboard: {
                      ...eeconfig[refkey].keyboard,
                      enableOs: e.target.checked,
                    },
                  },
                };
              })
            );
            console.log(newConfig);
            setEeconfig(newConfig);
          }}
        ></input>
      </label>
</div>
    );
  };

  return (
    <div className="App">
      <button onClick={() => readEeConfig((c) => setEeconfig(c))}>open</button>
      {editor()}
    </div>
  );
}

export default App;
