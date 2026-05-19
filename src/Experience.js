import { BakeShadows, Html, OrbitControls, Environment } from "@react-three/drei";
import { Perf } from "r3f-perf";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import PhysicsObjects from "./PhysicsObjects";
import { useContext, useEffect, useRef, useState } from "react";
import { lettersContext } from "./LettersContext";
import endTurn from "./helpers/endTurn";
import { socket } from "./SocketConnection";
import UserInterface from "./UserInterface";
import { useFrame, useThree } from "@react-three/fiber";
import { generateTiles } from "./helpers/randomLetters";
import { Euler, Quaternion, Vector3 } from "three";
import cameraAnimation from "./helpers/cameraAnimation";
import gsap from "gsap";
import { SlowMo } from "gsap/all";
import startingAnimation from "./helpers/startingAnimation";
import Factory from "./Factory";

export default function Experience() {
  const { lettersState, lettersDispatch } = useContext(lettersContext);
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const roundSlider = useRef();
  const overlay = useRef();

  const { camera, controls } = useThree();

  const handleGameStart = (opponentTiles, userTiles, isStartingUser) => {
    gsap.to(overlay.current.children[0], { opacity: 0 }).then(() => {
      overlay.current.children[0].classList.add("hidden");
      setGameStarted(true);

      startingAnimation(camera, controls, roundSlider, overlay, isStartingUser, lettersDispatch);

      if (opponentTiles && userTiles) {
        lettersDispatch({
          type: "TILES_INIT",
          userTiles: userTiles,
          opponentTiles: opponentTiles,
        });
      } else {
        const startingTilesUser = generateTiles(10);
        const startingTilesOpponent = generateTiles(10);
        lettersDispatch({
          type: "TILES_INIT",
          userTiles: startingTilesUser,
          opponentTiles: startingTilesOpponent,
        });
        socket.emit("TILES_INIT", {
          userTiles: startingTilesUser,
          opponentTiles: startingTilesOpponent,
        });
      }
    });
  };

  useEffect(() => {
    const handleTurnSwitch = ({ user }) => {
      lettersDispatch({ type: "TURN_SWITCH", turn: user });
    };
    const handleTilesInit = ({ userTiles, opponentTiles }) => {
      handleGameStart(userTiles, opponentTiles, false);
    };
    const handleScoreUpdate = (data) => {
      console.log("Client received score update:", data);
      lettersDispatch({ type: "OPPONENT_SCORE_UPDATE", amount: data.score });
    };

    socket.on("TURN_SWITCH_CLIENT", handleTurnSwitch);
    socket.on("TILES_INIT_CLIENT", handleTilesInit);
    socket.on("SCORE_UPDATE_CLIENT", handleScoreUpdate);

    return () => {
      socket.off("TURN_SWITCH_CLIENT", handleTurnSwitch);
      socket.off("TILES_INIT_CLIENT", handleTilesInit);
      socket.off("SCORE_UPDATE_CLIENT", handleScoreUpdate);
    };
  }, []);

  return (
    <>
      <color attach="background" args={["#e6e6fa"]} />
      <Environment preset="city" />

      <EffectComposer>
        <Bloom mipmapBlur intensity={0.5} />
      </EffectComposer>

      <BakeShadows />

      {/* <Perf position="top-left" /> */}

      <OrbitControls
        makeDefault
        enablePan={true}
        enabled={true}
        autoRotate={!gameStarted}
        autoRotateSpeed={0.5}
      />

      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-near={-50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <ambientLight intensity={0.5} />

      <Html fullscreen style={{ pointerEvents: "none", zIndex: 5 }}>
        <UserInterface
          camera={camera}
          controls={controls}
          lettersState={lettersState}
          setShowInstructions={setShowInstructions}
        />
      </Html>

      {gameStarted && lettersState.turn !== null && lettersState.turn !== socket.id && (
        <Html fullscreen style={{ pointerEvents: "none", zIndex: 10 }}>
          <div style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255, 0, 0, 0.8)",
            color: "white",
            padding: "1rem 2rem",
            fontSize: "2rem",
            fontWeight: "bold",
            borderRadius: "10px",
            fontFamily: "sans-serif",
            letterSpacing: "2px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.5)"
          }}>
            OPPONENT'S TURN
          </div>
        </Html>
      )}

      {showInstructions && (
        <Html fullscreen zIndexRange={[100, 0]}>
          <div className="centered instructions-modal">
            <h2>How to Play PolyWord</h2>
            <ul>
              <li>Drag letters from your rack to form words on the board.</li>
              <li>Words must connect to existing tiles (except for the first turn).</li>
              <li><strong>Controls:</strong> Zoom with your scroll wheel. Move around with left click and drag.</li>
              <li>Words are scored based on the letters used and word length.</li>
              <li>Click "End Turn" when you are finished placing your word.</li>
            </ul>
            <button onClick={() => setShowInstructions(false)}>Close</button>
          </div>
        </Html>
      )}

        <Html fullscreen wrapperClass="start__menu" ref={overlay} style={{transform:`translateY(${lettersState.showOverlay ? '0px' : '200vh'})`}}>
          <div className="centered start__menu__content">
            <ul>
              <li onClick={() => handleGameStart()}>Start</li>
              <li onClick={() => setShowInstructions(true)}>Instructions</li>
              <li>Quit</li>
            </ul>
          </div>
          <div className="centered round__slider" ref={roundSlider}>
            <p className="turn">Your Turn</p>
            <p className="round">Round {lettersState.round}</p>
          </div>
        </Html>
      <PhysicsObjects roundSlider={roundSlider} overlay={overlay} />
    </>
  );
}
