import { RigidBody } from '@react-three/rapier'

function PlayerTilesHolder(props) {
  return (
    <RigidBody type="fixed" mass={0} {...props}>
    <mesh>
      <boxGeometry args={[25,1,10]}/>
      <meshStandardMaterial/>
    </mesh>
        </RigidBody>
  )
}

export default PlayerTilesHolder