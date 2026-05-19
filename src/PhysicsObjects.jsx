import React from 'react'
import Tile from './Tile'
import { Physics } from '@react-three/rapier'

function PhysicsObjects({roundSlider, overlay}) {
  return (
    <>
    <Physics>
      <Tile roundSlider={roundSlider} overlay={overlay}/>
    </Physics>
    </>
  )
}

export default PhysicsObjects