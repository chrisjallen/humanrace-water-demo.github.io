// import { useState } from "react";
import { FormEventHandler, useEffect, useLayoutEffect } from "react";
import "./App.css";
import "./scene/ripples/ripples";
import RipplesScene from "./scene/scene";

const PASSWORD = "evianPharrellW@ter";

function App() {
  const { access, attemptLogin } = useSec();
  useLayoutEffect(() => {
    if (access) {
      new RipplesScene({
        viscosity: 15,
        speed: 15,
        size: 1.25,

        displacementStrength: 5,
        lightIntensity: 0.1,
        shadowIntensity: 0.1
      });
    }
  }, [access]);

  return (
    <>
      {!access && (
        <section className="auth">
          <form action="" onSubmit={attemptLogin}>
            <label htmlFor="password">Enter password:</label>
            <input type="text" name="password" id="password" />
          </form>
        </section>
      )}
      {access && (
        <>
          <main>
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
                  src="./assets/ZGhertner_PW_1120_1164-09_v2.jpg"
                  alt="Photo by David Pisnoy on Unsplash"
                  crossOrigin="anonymous"
                  data-sampler="planeTexture"
                />
              </div>
            </section>
          </main>
        </>
      )}
    </>
  );
}

const useSec = () => {
  const access = localStorage.getItem("access");
  if (!access) {
    const attemptLogin: FormEventHandler<HTMLFormElement> = (event) => {
      const password =
        event.currentTarget.querySelector<HTMLInputElement>("#password")?.value;
      if (password === PASSWORD) {
        localStorage.setItem("access", "true");
      }
    };
    return {
      access: false,
      attemptLogin
    };
  }
  return {
    access: true
  };
};

export default App;
