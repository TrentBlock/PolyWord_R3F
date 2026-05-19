const findStart = (board, startingLetter, direction) =>{
  const oppositeDirection = direction==="z" ? "x" : "z";
  const constantValue = startingLetter.vec3[oppositeDirection];
  let sortedBoard = board.filter(i=>i.vec3[oppositeDirection] == constantValue).sort((a,b)=>{
    if(a.vec3[direction] < b.vec3[direction]) return -1;
    return 1;
  });
  
  let counter = startingLetter.vec3[direction];
  while(true){
    if(!sortedBoard.find(i=>i.vec3[direction] == counter)) break;
    counter--;
  }
  
  sortedBoard = sortedBoard.filter(i=>i.vec3[direction] > counter);
  
  return sortedBoard;
}
export default findStart;