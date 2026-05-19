import React, { useEffect } from "react";
import {
  Clone,
  meshBounds,
  OrbitControls,
  Text3D,
  useGLTF,
} from "@react-three/drei";
import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, Quaternion, Vector3 } from "three";
import { forwardRef } from "react";
import { lerp } from "three/src/math/MathUtils";
import { useContext } from "react";
import { lettersContext } from "./LettersContext";
import checkBoardValid from "./helpers/checkBoardValid";
import { socket } from "./SocketConnection";
import gsap from "gsap";
import cameraAnimation from "./helpers/cameraAnimation";
import objectAnimation from "./helpers/objectAnimation";

const Letter = forwardRef(
  (
    {
      position,
      startingPos,
      animatingFrom,
      letters,
      type,
      dispatch,
      draggable,
      defaultLocked = false,
      isUser,
      defaultAnimated = true,
    },
    ref
  ) => {
    const tilesGLTF = useGLTF("./Tiles.glb");
    const alphabet = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];
    const { lettersState, lettersDispatch } = useContext(lettersContext);
    const { camera, controls } = useThree();
    const groupRef = useRef();
    const materialRef = useRef();
    const [clicked, setClicked] = useState(false);
    const [finalVecPosition, setFinalVecPosition] = useState(null);
    const [currentSpot, setCurrentSpot] = useState(startingPos);
    const [locked, setLocked] = useState(defaultLocked);
    const [animated, setAnimated] = useState(defaultAnimated);
    const vec = new Vector3(0, 20, 0);
    let time = 0;
    const duration = 2.5;

    const handleClick = (e) => {
      e.stopPropagation();
      if (!locked) {
        if (!clicked) {
          setClicked(true);
          controls.enabled = false;
          camera.updateProjectionMatrix();
          const from = camera.quaternion.clone();
          const to = new Quaternion()
            .setFromEuler(new Euler(-Math.PI / 2 + Math.atan(2 / 15), 0, 0))
            .normalize();
          let lastPlayedTile =
            lettersState.lastLetterPosition || new Vector3(0, 0, 0);

          cameraAnimation(
            from,
            to,
            new Vector3(lastPlayedTile.x, 15, lastPlayedTile.z),
            1.5,
            0,
            false,
            false,
            true,
            dispatch,
            type,
            camera,
            controls,
            2
          );
        } else {
          let childrenPosition = groupRef.current.children[0].position;
          const checkBoardValidVector3 = new Vector3(
            Math.round(childrenPosition.x),
            Math.round(childrenPosition.y),
            Math.round(childrenPosition.z)
          );

          const boardValidArray = lettersState.board.concat(
            lettersState.lastTurn
          );
          if (checkBoardValid(boardValidArray, checkBoardValidVector3)) {
            dispatch({
              index: type,
              draggable: false,
              augment: [0, 0, 0],
            });
            dispatch({ index: type, type: "MATERIAL", material: materialRef });
            time = 0;
            if (draggable) {
              gsap.to(groupRef.current.children[0].position, {
                x: Math.round(childrenPosition.x),
                y: 0.5,
                z: Math.round(childrenPosition.z),
                duration: 0.5,
                onComplete: () => {
                  const finalPos = new Vector3(
                    Math.round(childrenPosition.x),
                    0.5,
                    Math.round(childrenPosition.z)
                  );
                  lettersDispatch({
                    type: "TURN_UPDATE",
                    vec3: finalPos,
                    letter: letters[0],
                    POSITION_ID: currentSpot,
                    user: "user",
                  });
                  // lettersDispatch({type:"REMOVE_HOLDER_TILE", POSITION_ID: new Vector3(position[0], position[1], position[2]), user:'user', moved:true});
                  socket.emit("LETTER_PLAYED", {
                    vec3: finalPos,
                    letter: letters[0],
                    POSITION_ID: new Vector3(
                      position[0],
                      position[1],
                      position[2]
                    ),
                  });
                },
              });
              setLocked(true);
              setClicked(false);
              controls.enabled = false;
              const from = camera.quaternion.clone();
              const to = new Quaternion().setFromEuler(
                new Euler(-Math.PI / 2 + Math.atan(30 / 15), 0, 0)
              );
              setTimeout(() => {
                cameraAnimation(
                  from,
                  to,
                  new Vector3(0, 15, 30),
                  1.5,
                  0,
                  true,
                  true,
                  false,
                  null,
                  null,
                  camera,
                  controls,
                  30
                );
              }, 1000);
            }
          }
        }
      }
    };

    const handleDeletion = (e) => {
      e.stopPropagation();
      if (
        lettersState.lastTurn.find((t) =>
          t.vec3.equals(groupRef.current.children[0].position)
        )
      ) {
        const finalPos = groupRef.current.children[0].position;
        console.log(lettersState.userEmptySpaces);
        const animationVector = new Vector3().fromArray(
          lettersState.userEmptySpaces[0]
        );
        lettersDispatch({ type: "REMOVE_EMPTY_SPACE", user: "user" });
        socket.emit("LETTER_REMOVED", {
          vec3: new Vector3(finalPos.x, finalPos.y, finalPos.z),
          POSITION_ID: new Vector3().fromArray(position),
          posToMove: animationVector,
        });
        lettersDispatch({ type: "REMOVE_LETTER", position: finalPos });
        objectAnimation(groupRef.current.children[0], animationVector, 1);
        setCurrentSpot([
          animationVector.x,
          animationVector.y,
          animationVector.z,
        ]);
        setLocked(false);
      }
    };

    useEffect(() => {
      // console.log(animatingFrom)
      if (animatingFrom && groupRef.current) {
        setTimeout(() => {
          gsap.to(groupRef.current.children[0].position, {
            keyframes: [
              {
                x: startingPos[0],
                y: startingPos[1] + 5.25,
                z: startingPos[2],
              },
              {
                x: startingPos[0],
                y: startingPos[1],
                z: startingPos[2],
              },
            ],
            duration: 2,
            onComplete: () => {
              setAnimated(true);
            },
          });
        }, 1500);
      }
    }, []);
    return (
      <>
        {letters.map((l, idx) => {
          return (
            <group ref={groupRef} key={idx}>
              <Clone
                position={!animated ? animatingFrom : startingPos}
                rotation-y={isUser ? 0 : Math.PI}
                ref={ref}
                onClick={(e) => {
                  if (isUser) {
                    if (
                      lettersState.turn === null ||
                      lettersState.turn === socket.id
                    ) {
                      console.log(lettersState, socket.id);
                      handleClick(e);
                    }
                  }
                }}
                onContextMenu={(e) => {
                  if (locked && isUser) {
                    handleDeletion(e);
                  }
                }}
                scale={[0.5, 1, 0.5]}
                object={tilesGLTF.scene.children[alphabet.indexOf(letters[0])]}
              >
                <meshBasicMaterial
                  ref={materialRef}
                  color={[0.277, 0.292, 0.305]}
                  toneMapped={false}
                />
              </Clone>
            </group>
          );
        })}
      </>
    );
  }
);
useGLTF.preload("./Tiles.glb");
export default Letter;
