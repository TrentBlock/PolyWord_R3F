import { generateTiles } from "./randomLetters";
let globalCount = -1;
const createNewTile = (
  lettersState,
  lettersDispatch,
  socket,
  animatingFrom = null,
  count=1
) => {
  globalCount=count;
  globalCount--;
  console.log(animatingFrom);
  let newTile;
  console.log(lettersState.userEmptySpaces);
  if (lettersState.userEmptySpaces.length > 0) {
    let firstEmptySpace = lettersState.userEmptySpaces[0];
    firstEmptySpace[2] = Math.abs(lettersState.userEmptySpaces[0][2]);
    newTile = generateTiles(1, firstEmptySpace, animatingFrom)[0];
    lettersDispatch({ type: "REMOVE_EMPTY_SPACE", user: "user" });
    socket.emit("SPACE_REMOVED");
  } else {
    newTile = generateTiles(1, null, animatingFrom)[0];
  }
  console.log(newTile);
  let newUserTiles = lettersState.userTiles.concat([newTile]);
  let newOpponentTiles = lettersState.opponentTiles;
  let flippedUserTiles = lettersState.userTiles.map((t) =>
    t.startingPos
      ? {
          ...t,
          startingPos: [t.startingPos[0], t.startingPos[1], -t.startingPos[2]],
        }
      : t
  );
  if (newTile.startingPos) {
    // need to flip z value IF CUSTOM STARTING POS or opponent will place tile wrong
    let flippedTile = {
      letter: newTile.letter,
      startingPos: [
        newTile.startingPos[0],
        newTile.startingPos[1],
        -Math.abs(newTile.startingPos[2]),
      ],
      animatingFrom: animatingFrom ? [
        -animatingFrom[0],
        animatingFrom[1],
        animatingFrom[2],
      ] : null,
    };
    console.log(flippedTile);
    flippedUserTiles = flippedUserTiles.concat([flippedTile]);
  } else {
    flippedUserTiles = flippedUserTiles.concat([
      {
        ...newTile,
        animatingFrom: animatingFrom ? [-animatingFrom[0], animatingFrom[1], animatingFrom[2]] : null,
      },
    ]);
  }

  console.log(newUserTiles, newOpponentTiles, flippedUserTiles);
  lettersDispatch({
    type: "TILES_INIT",
    userTiles: newUserTiles,
    opponentTiles: newOpponentTiles,
  });

  socket.emit("LETTERS_ADD", {
    userTiles: flippedUserTiles,
    opponentTiles: newOpponentTiles,
  });
  socket.emit("TURN_SWITCH");
if(globalCount > 0){
  setTimeout(()=>{
    createNewTile(lettersState, lettersDispatch, socket, animatingFrom, globalCount-1);
  },5000);
}
};
export default createNewTile;
