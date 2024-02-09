// import { useState } from "react";
import { useEffect, useLayoutEffect } from "react";
import "./App.css";
import "./scene/ripples/ripples";
import RipplesScene from "./scene/scene";

function App() {
  // const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    const rippleScene = new RipplesScene({
      viscosity: 7.5,
      speed: 5,
      size: 1.25,

      displacementStrength: 1.5,
      lightIntensity: 5,
      shadowIntensity: 2.5
    });
  }, []);

  return (
    <>
      <div id="canvas"></div>

      <div id="content">
        <div id="canvas"></div>

        <div id="water-ripples">
          <div id="water-ripples-title">
            <h1>Ripples</h1>
          </div>
          <img
            src="https://images.selfridges.com/is/image/selfridges/221128_HUMANRACE_9?scl=1&qlt=60,1"
            alt="Photo by David Pisnoy on Unsplash"
            crossOrigin="anonymous"
            data-sampler="planeTexture"
          />
        </div>
      </div>
    </>
  );
}

export default App;
