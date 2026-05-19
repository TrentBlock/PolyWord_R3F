import { createContext, useReducer } from "react";
import { Vector3 } from "three";
const lettersContext = createContext();

function Provider({ children }) {
  let initialState = {
    lastTurn: [],
    board: [],
    lastLetterPosition: null,
    turn: null,
    userTiles: [],
    opponentTiles: [],
    userEmptySpaces: [],
    opponentEmptySpaces: [],
    round: 1,
    showOverlay: true,
    score: 0,
    opponentScore: 0,
    userFactories: [],
    opponentFactories: [],
  };
  const lettersReducer = (state, action) => {
    if (action.type == "BOARD_UPDATE") {
      let board = [...state.board];
      let lastTurn = [...state.lastTurn];
      let lastVec3 = null;
      if (lastTurn.length > 0) lastVec3 = lastTurn[lastTurn.length - 1].vec3;
      board = board.concat(lastTurn);
      lastTurn = [];
      return {
        ...state,
        board,
        lastTurn,
        lastLetterPosition: lastVec3 || state.lastLetterPosition,
      };
    }
    if (action.type == "TURN_UPDATE") {
      let lastTurn = [...state.lastTurn];
      let arr =
        action.user == "user"
          ? [...state.userEmptySpaces]
          : [...state.opponentEmptySpaces];
      arr.push(action.POSITION_ID);
      arr = arr.sort((a, b) => {
        if (a[2] > b[2]) return 1;
        if (a[2] < b[2]) return -1;
        if (a[0] > b[0]) return 1;
        if (a[0] < b[0]) return -1;
        return 0;
      });
      const vec3 = new Vector3(
        Math.round(action.vec3.x),
        Math.round(action.vec3.y),
        Math.round(action.vec3.z)
      );
      if (!lastTurn.find((i) => i.vec3.equals(vec3))) {
        lastTurn.push({ vec3, letter: action.letter });
      }
      if (action.user == "user") {
        return {
          ...state,
          lastTurn,
          lastLetterPosition: vec3,
          userEmptySpaces: arr,
        };
      }
      return {
        ...state,
        lastTurn,
        lastLetterPosition: vec3,
        opponentEmptySpaces: arr,
      };
    }
    if (action.type == "REMOVE_LETTER") {
      let lastTurn = [...state.lastTurn];
      lastTurn = lastTurn.filter((i) => !i.vec3.equals(action.position));
      return { ...state, lastTurn };
    }
    if (action.type == "LETTER_UPDATE") {
      return { ...state, lastLetterPosition: action.letterPosition };
    }
    if (action.type == "TURN_SWITCH") {
      console.log(action.turn);
      return { ...state, turn: action.turn };
    }
    if (action.type == "TILES_INIT") {
      return {
        ...state,
        userTiles: action.userTiles,
        opponentTiles: action.opponentTiles,
      };
    }
    if (action.type == "TILES_ADD") {
      let arr = action.user == "user" ? state.userTiles : state.opponentTiles;
      arr.push(action.tile);
      if (action.user == "user") {
        return { ...state, userTiles: arr };
      }
      return { ...state, opponentTiles: arr };
    }
    if (action.type == "ROUND_INCREMENT") {
      return { ...state, round: state.round + 1 };
    }
    if (action.type == "CHANGE_OVERLAY") {
      return { ...state, showOverlay: action.value };
    }
    if (action.type == "REMOVE_EMPTY_SPACE") {
      let arr =
        action.user == "user"
          ? [...state.userEmptySpaces]
          : [...state.opponentEmptySpaces];
      arr.shift();
      if (action.user == "user") {
        return { ...state, userEmptySpaces: arr };
      }
      return { ...state, opponentEmptySpaces: arr };
    }
    if (action.type == "SCORE_ADD") {
      let tempScore = state.score;
      tempScore += action.amount;
      return { ...state, score: tempScore };
    }
    if (action.type == "OPPONENT_SCORE_UPDATE") {
      return { ...state, opponentScore: action.amount };
    }
    if (action.type == "ADD_FACTORY") {
      let arr =
        action.user == "user"
          ? [...state.userFactories]
          : [...state.opponentFactories];
      arr.push({ type: action.factoryType, position:action.position, round: action.round });
      console.log(arr);
      if (action.user == "user") {
        return { ...state, userFactories: arr };
      }
      return { ...state, opponentFactories: arr };
    }
  };
  const [lettersState, lettersDispatch] = useReducer(
    lettersReducer,
    initialState
  );
  return (
    <lettersContext.Provider value={{ lettersState, lettersDispatch }}>
      {children}
    </lettersContext.Provider>
  );
}

export { lettersContext, Provider };
