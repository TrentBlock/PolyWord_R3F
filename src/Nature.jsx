import { Clone, TransformControls, useFBX, PivotControls} from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Vector3 } from "three";
import { useMemo } from "react";

function Nature({type, count, randomWidth}) {
    let fbx = useFBX('Nature/assets/asset.fbx').children.filter(c=>c.ID !== 44001567).map(c=>{
        if ([32724081, 332838798, 734054282,804450100].includes(c.ID)) {
            c.TYPE = "GRASS";
        } else {
            c.TYPE = "OTHER";
        }
        return c;
    });
    const items = useMemo(()=>new Array(count).fill().map((_,idx)=>{
        const ranIdx = Math.floor(Math.random()*fbx.length);
        fbx[ranIdx].geometry.computeBoundingBox();
        return <Clone
        castShadow
        receiveShadow
        key={idx}
        object={type===-1 ? fbx[ranIdx] : fbx[type]}
        scale={fbx[ranIdx].TYPE == "GRASS" ? [1,1,1] : Math.random() * 0.002}
        position={[(Math.random()*randomWidth - randomWidth/2), fbx[ranIdx].TYPE == "GRASS" ? 0.025 : 0, (Math.random()*randomWidth - randomWidth/2)]}
        rotation={[fbx[ranIdx].rotation.x + Math.random() * 0.25 - 0.125, fbx[ranIdx].rotation.y + Math.random() * 0.25 - 0.125,fbx[ranIdx].rotation.z + Math.random() * 0.25 - 0.125]}
            />
    }), []);
     return (
        items.map(i=>i)
    )
}//Math.random() * 0.25 - 0.125, Math.random() * 0.25 - 0.125, Math.random() * 0.25 - 0.125

export default Nature;
