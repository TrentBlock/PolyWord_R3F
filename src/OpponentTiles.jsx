import { useEffect } from "react";
import { forwardRef } from "react";
import { useContext, useRef } from "react";
import { Vector3 } from "three";
import objectAnimation from "./helpers/objectAnimation";
import Letter from "./Letter";
import { lettersContext } from "./LettersContext";
import { socket } from "./SocketConnection";

const OpponentTiles = forwardRef((props, ref) => {
  const { lettersState, lettersDispatch } = useContext(lettersContext);
  const tiles = useRef([]);

  useEffect(() => {
    socket.on("LETTER_RECEIVED", (data) => {
      console.log(data);
      console.log(tiles);
      lettersDispatch({
        type: "TURN_UPDATE",
        vec3: data.vec3,
        letter: data.letter,
        POSITION_ID: data.POSITION_ID,
        user: "opponent",
      });
      const pos = new Vector3(
        data.POSITION_ID.x,
        data.POSITION_ID.y,
        -data.POSITION_ID.z
      );
      const tileToAnimate = tiles.current.find((c) =>
        c && c.POSITION_ID && c.POSITION_ID.distanceTo(pos) < 0.1
      );
      if (tileToAnimate) {
        objectAnimation(tileToAnimate, data.vec3, 1, new Vector3(0, 0, 0));
      } else {
        console.warn("Tile to animate not found for LETTER_RECEIVED", pos);
      }
    });

    socket.on("LETTER_REMOVED_CLIENT", (data) => {
      console.log(lettersState);
      lettersDispatch({ type: "REMOVE_LETTER", position: data.vec3 });
      lettersDispatch({ type: "REMOVE_EMPTY_SPACE", user: "opponent" });
      const pos = new Vector3(
        data.POSITION_ID.x,
        data.POSITION_ID.y,
        -data.POSITION_ID.z
      );
      const tileToAnimate = tiles.current.find((c) =>
        c && c.POSITION_ID && c.POSITION_ID.distanceTo(pos) < 0.1
      );
      if (tileToAnimate) {
        let posToMove = data.posToMove;
        posToMove.z = -posToMove.z;
        objectAnimation(tileToAnimate, posToMove, 1, new Vector3(0, -Math.PI, 0));
      } else {
        console.warn("Tile to animate not found for LETTER_REMOVED", pos);
      }
      console.log(lettersState.userLetterHolder);
    });

    socket.on("SPACE_REMOVED_CLIENT", () => {
      lettersDispatch({ type: "REMOVE_EMPTY_SPACE", user: "opponent" });
    });

    socket.on("CLIENT_LETTERS_ADD", (data) => {
      console.log("Opponent Tiles Add");
      console.log(data);
      lettersDispatch({
        type: "TILES_INIT",
        userTiles: data.opponentTiles,
        opponentTiles: data.userTiles,
      });
    });

    socket.on("FACTORY_ADD_CLIENT", (data) => {
      console.log(data);
      lettersDispatch({
        type: "ADD_FACTORY",
        user: "opponent",
        factoryType: data.type,
        position: data.position,
      });
    });
  }, []);

  return (
    <group ref={ref}>
      {lettersState.opponentTiles.map(
        ({ letter, startingPos, animatingFrom }, idx) => {
          let startingPosID = [
            -6.75 + (idx % 10) * 1.5,
            0.5,
            -15 - Math.floor(idx / 10),
          ];
          return (
            <Letter
              key={idx}
              position={startingPosID}
              animatingFrom={animatingFrom}
              startingPos={startingPos || startingPosID}
              letters={[letter]}
              type={idx}
              ref={(el) => {
                if (el) {
                  el.LETTER = letter;
                  el.POSITION_ID = new Vector3().fromArray(startingPosID);
                  tiles.current[idx] = el;
                }
              }}
              dispatch={() => {}}
              draggable={false}
              defaultLocked={true}
              isUser={false}
              defaultAnimated={animatingFrom ? false : true}
            />
          );
        }
      )}
    </group>
  );
});

export default OpponentTiles;
