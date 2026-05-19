import { Color, Vector3 } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useRef, useState, useContext, useReducer, useMemo } from "react";
import Letter from "./Letter";
import vectorLerp from "./helpers/vectorLerp";
import { lettersContext } from "./LettersContext";
import checkBoardValid from "./helpers/checkBoardValid";
import { socket } from "./SocketConnection";
import { useEffect } from "react";
import OpponentTiles from "./OpponentTiles";
import { Html } from "@react-three/drei";
import endTurn from "./helpers/endTurn";
import gsap from "gsap";
import startingAnimation from "./helpers/startingAnimation";
import { generateTiles } from "./helpers/randomLetters";
import createNewTile from "./helpers/createNewTile";
import Shop from "./Shop";
import Factory from "./Factory";

function Tile({ roundSlider, overlay }) {
  const { lettersState, lettersDispatch } = useContext(lettersContext);
  const moveable = useRef([]);
  const opponentTiles = useRef([]);
  const [oneMore, setOneMore] = useState(false);
  const { camera, controls } = useThree();

  useEffect(() => {
    socket.on("END_TURN_CLIENT", () => {
      lettersDispatch({ type: "BOARD_UPDATE" });
      console.log("Client End Turn");
      lettersDispatch({ type: "TURN_SWITCH", turn: socket.id });
      if(lettersState.round >= 5){
        overlay.current.children[1].innerHTML = `<p className="turn">Game Over!</p>`;
        controls.enabled=false;
      }
      startingAnimation(
        camera,
        controls,
        roundSlider,
        overlay,
        true,
        lettersDispatch
      );

      createNewTile(lettersState, lettersDispatch, socket,null, 1);
      setOneMore(true);
      if(lettersState.round >= 5){controls.enabled=false;}
    });

    return () => socket.off("END_TURN_CLIENT");
  }, [controls, lettersState]);

  useEffect(()=>{
    if(oneMore){
      createNewTile(lettersState, lettersDispatch, socket,null, 1);
      setOneMore(false);
    }
  },[lettersState]);

  let initialDraggable = [];
  const draggableReducer = (state, action) => {
    let tempArr = [...state];
    if (action.type == "MATERIAL") {
      tempArr[action.index].material = action.material;
      return [...tempArr];
    }
    tempArr[action.index] = {
      draggable: action.draggable,
      augment: action.augment,
    };
    return [...tempArr];
  };
  const [state, dispatch] = useReducer(draggableReducer, initialDraggable);

  const handlePointerMove = (e) => {
    for (let i = 0; i < state.length; i++) {
      if (state[i] !== undefined) {
        if (state[i].draggable) {
          moveable.current[i].position.set(e.point.x, 0.5, e.point.z);
        }
      }
    }
  };

  const purchaseFactory = () => {
    console.log("Purchased!");
    const position = new Vector3(-12, 5, (Math.random() - 0.5) * 10);
    lettersDispatch({
      type: "ADD_FACTORY",
      user: "user",
      factoryType: "Normal",
      position,
      round: lettersState.round
    });
    socket.emit("FACTORY_ADD", { type: "Normal", position, round:lettersState.round });
  };

  const handleEndTurn = () => {
    const turnResult = endTurn(lettersState, lettersDispatch);
    console.log(turnResult.vectors);
    const opponentObjects = opponentTiles.current.children.map(
      (i) => i.children[0]
    );
    const lettersToAnimate = opponentObjects
      .concat(moveable.current)
      .filter((i) => turnResult.vectors.find((l) => l.equals(i.position)));
    console.log(lettersToAnimate);
    for (let letter of lettersToAnimate) {
      const tl = gsap.timeline();
      tl.to(letter.material.color, {
        r: turnResult.status ? 0 : 2,
        g: turnResult.status ? 2 : 0,
        b: 0,
        duration: 0.25,
      });
      tl.to(letter.material.color, {
        r: 0.277,
        g: 0.292,
        b: 0.305,
        duration: 0.25,
        delay: 1,
      });
    }
    if (turnResult.status) {
      lettersDispatch({ type: "ROUND_INCREMENT" });
      socket.emit("END_TURN");
      socket.emit("SCORE_UPDATE", { score: lettersState.score + turnResult.money });
    }
  };

  return (
    <>
      <RigidBody type="fixed">
        <mesh
          position={[0, -50, 0]}
          receiveShadow
          castShadow
          onPointerMove={(e) => handlePointerMove(e)}
        >
          <boxGeometry args={[200, 100, 200]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        <mesh position={[0, 0.01, 0]} receiveShadow>
          <boxGeometry args={[26, 0.02, 26]} />
          <meshStandardMaterial color="#2d2d2d" roughness={0.7} metalness={0.2} />
        </mesh>
        
        <gridHelper args={[26, 26, '#4CAF50', '#444']} position={[0.5, 0.021, 0.5]} />
      </RigidBody>

      {lettersState.userTiles.map(
        ({ letter, startingPos, animatingFrom }, idx) => {
          let startingPosID = [
            -6.75 + (idx % 10) * 1.5,
            0.5,
            15 + Math.floor(idx / 10),
          ];

          return (
            <Letter
              key={idx}
              position={startingPosID}
              // startingPos = {startingPos ? [startingPos.x, startingPos.y, startingPos.z] : [-2 + idx, 1, 15 + Math.floor(idx/10)]}
              startingPos={startingPos || startingPosID}
              animatingFrom={animatingFrom}
              letters={[letter]}
              type={idx}
              ref={(el) => {
                if (el) {
                  el.LETTER = letter;
                  el.POSITION_ID = new Vector3().fromArray(startingPosID);
                  moveable.current[idx] = el;
                }
              }}
              dispatch={dispatch}
              draggable={
                state.length > 0
                  ? state[idx]
                    ? state[idx].draggable
                    : false
                  : false
              }
              defaultLocked={false}
              isUser={true}
              defaultAnimated={animatingFrom ? false : true}
            />
          );
        }
      )}
      <OpponentTiles ref={opponentTiles} />

      <Html fullscreen style={{ pointerEvents: "none", zIndex: 5 }}>
        <div className="ui-money-container">
          <div className="money-label">Score</div>
          <div className="money-value">{lettersState.score}</div>
          
          <div className="money-label" style={{marginTop: '15px'}}>Opponent Score</div>
          <div className="money-value" style={{color: '#e74c3c'}}>{lettersState.opponentScore}</div>
        </div>
        
        <div className="ui-action-container">
          <button
            onClick={() =>
              (lettersState.turn === null || lettersState.turn === socket.id) &&
              handleEndTurn()
            }
            className={`modern-btn action-btn ${lettersState.turn !== null && lettersState.turn !== socket.id ? 'disabled' : ''}`}
          >
            End Turn
          </button>
        </div>
      </Html>
    </>
  );
}

export default Tile;
