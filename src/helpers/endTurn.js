import calculateMoney from "./calculateMoney";
import checkDirectionOfPlay from "./checkDirectionOfPlay";
import findStart from "./findStart";
import words from "./WORDS";
const endTurn = ({lastTurn, board}, lettersDispatch) => {
    if (lastTurn.length === 0) return {status:false, word: "", vectors: []};

    let directionOfPlay = "x";
    if (lastTurn.length > 1) {
        directionOfPlay = checkDirectionOfPlay(lastTurn[0].vec3, lastTurn[1].vec3);
    } else {
        const surroundingZ = board.filter(input => input.vec3.x === lastTurn[0].vec3.x && Math.abs(input.vec3.z - lastTurn[0].vec3.z) === 1);
        if (surroundingZ.length > 0) {
            directionOfPlay = "z";
        }
    }

    const oppositeDirectionOfPlay = directionOfPlay === "z" ? "x" : "z";
    let wordsToCheck = [];
    let letterVectors = [];
    
    const assembleWord = (previousLetter, currentLetter) =>{
        let surrounding = findSurrounding(currentLetter, directionOfPlay);
        let alternateSurrounding = [];
        if(lastTurn.find(i=>i.vec3.equals(currentLetter.vec3))){ // if you played the letter on this turn...
            alternateSurrounding = findSurrounding(currentLetter, oppositeDirectionOfPlay);
            if(alternateSurrounding.length > 0){
                const oppositeWord = findStart(board.concat(lastTurn), currentLetter, oppositeDirectionOfPlay).filter(v=>v.vec3[directionOfPlay] === currentLetter.vec3[directionOfPlay]);
                wordsToCheck.push(oppositeWord.reduce((a,e)=>a+e.letter, ""));
            }
        }
        // let horizontalSurrounding = findSurrounding(currentLetter, 'x');
        if(previousLetter !== null) surrounding = surrounding.filter(input=> input.letter !== previousLetter && !(input.vec3.equals(previousLetter.vec3)));
        if(surrounding.length > 0){
            for(let letter of surrounding){
                letterVectors.push(currentLetter.vec3);
                return ""+currentLetter.letter + assembleWord(currentLetter, letter)
            }
        }else{
            letterVectors.push(currentLetter.vec3);
            return currentLetter.letter;
        }
    }
    
    const findSurrounding = (letter, direction) => {
        let opposite = direction === "z" ? "x" : "z";
        return (board.concat(lastTurn)).filter(input=>(input.vec3[direction] === letter.vec3[direction] - 1 && input.vec3[opposite] === letter.vec3[opposite]) || (input.vec3[direction] === letter.vec3[direction] + 1 && input.vec3[opposite] === letter.vec3[opposite]));
    }
    const startingLetter = findStart(board.concat(lastTurn), lastTurn[0], directionOfPlay);
    // console.log(board.concat(lastTurn), lastTurn[0], directionOfPlay, startingLetter);
    const finalVerticalLetter = assembleWord(null, startingLetter[0]);
    console.log(wordsToCheck);
    console.log(finalVerticalLetter);
    if(words.includes(finalVerticalLetter)){
        const wordMoney = calculateMoney(finalVerticalLetter.split(""));
        lettersDispatch({type:"BOARD_UPDATE"});
        lettersDispatch({type:"SCORE_ADD", amount: wordMoney});
        return {status:true, word: finalVerticalLetter, vectors: letterVectors, money: wordMoney};
    }
    return {status:false, word: finalVerticalLetter, vectors: letterVectors};
}
export default endTurn;


/*
let lettersTogether
const FirstX/ZValue = ...
const secondX/Z = ...
const HorizOrVert = "vert";
let wordsToCheck = [];

while(letter exists at this x and z value starting with the first letter you played){
    if(its in lastTurn){
        const allSurroundingLettersVert = checkSurroundingVert(null, currentLetter); // an array
        const allSurroundingLettersHoriz = checkSurroundingHoriz(null, currentLetter); // an array
    }
}

function checkSurroundingVert(previousLetter, currentLetter){
    let verticalLetters = findSurrounding(currentLetter) // an array
    if(verticalLetters includes previousLetter) remove it from verticalLetters
    if(verticalLetters.length > 0){
        for(letter of verticalLetters){
            return currentLetter + checkSurroundingVert(currentLetter, verticalLetters[0]);
        }
    } else{
       return currentLetter;
    }
}

          *A*
P H O N E *S*
          *K*

*/

