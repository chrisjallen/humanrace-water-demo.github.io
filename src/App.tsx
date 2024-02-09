// import { useState } from "react";
import { useEffect, useLayoutEffect } from "react";
import "./App.css";
import "./scene/ripples/ripples";
import RipplesScene from "./scene/scene";
// import pharLogo from "./assets/evian-phar-logo.png";
import testImageP from "./assets/ZGhertner_PW_1120_1164-09_v2.jpg";

function App() {
  // const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    const rippleScene = new RipplesScene({
      viscosity: 15,
      speed: 15,
      size: 1.25,

      displacementStrength: 5,
      lightIntensity: 0.1,
      shadowIntensity: 0.1
    });
  }, []);

  return (
    <>
      <div id="canvas"></div>
      <header>
        <div className="humanracelogo"></div>
        <div className="collab"></div>
        <div className="evianlogo"></div>
      </header>

      <section id="content">
        <div id="canvas"></div>

        <div id="water-ripples">
          <div id="water-ripples-title">
            <h1>Ripples</h1>
          </div>

          <img
            src={testImageP}
            alt="Photo by David Pisnoy on Unsplash"
            crossOrigin="anonymous"
            data-sampler="planeTexture"
          />
        </div>
      </section>
    </>
  );
}

export default App;
