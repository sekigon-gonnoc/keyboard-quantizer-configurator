import { useState } from "react";
import { readEeConfig } from "./quantizer-configurator";
import { EeConfig } from "./EeConfig";
import { EeConfigEditor } from "./EeConfigEditor";

function App() {
  const [eeconfig, setEeconfig] = useState<
    { [os: string]: EeConfig } | undefined
  >(undefined);

  const editor = () => {
    if (eeconfig) {
      return Object.entries(eeconfig).map((e) => {
        return <EeConfigEditor config={e[1]} />;
      });
    }
  };

  return (
    <div className="App">
      <button onClick={() => readEeConfig((c) => setEeconfig(c))}>open</button>
      {editor()}
    </div>
  );
}

export default App;
