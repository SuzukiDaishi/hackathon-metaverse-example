import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { Canvas, ThreeElements } from '@react-three/fiber'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { VRM } from '@pixiv/three-vrm'
import { PlayerComponent } from '@/components/PlayerComponent'
import { convertMixamoTracks } from '@/libs/VRMControlSystem'
import { transition } from '@/libs/TransitionProtocol'

/**
 * メインのステージ
 * 
 * @returns キャンバス
 */
export const StageComponent: React.FC<{ vrm: VRM }> = (props: { vrm: VRM }) => {

    // vrmを保持する
    const [vrm, setVrm] = useState<VRM>()

    // モーションを保持する
    const [idol, setIdol] = useState<THREE.AnimationClip>()
    const [walk, setWalk] = useState<THREE.AnimationClip>()

    // ルータ
    const router = useRouter()

    // VRMの初期化
    useEffect(() => {
        setVrm(props.vrm)
    }, [props.vrm])

    // アニメーションの初期化
    useEffect(() => {
        if (!vrm) return 
        
        const loader = new FBXLoader()
        loader.load(`${router.basePath}/assets/Happy Idle.fbx`, 
                    (fbx) => { setIdol(convertMixamoTracks('idol', fbx, vrm)) })
        loader.load(`${router.basePath}/assets/Walking.fbx`,
                    (fbx) => { setWalk(convertMixamoTracks('walk', fbx, vrm)) })
    }, [vrm])

    // プレイヤーがエリア外に出たら遷移
    const playerFrameEvent = useCallback((player: VRM) => {
        if (Math.abs(player.scene.position.x) > 5 ||
            Math.abs(player.scene.position.z) > 5) {
            transition(new URL('http://localhost:3000/'))
        }
    }, [vrm])

    return (<Canvas camera={{
        fov: 45,
        near: 0.1,
        far: 1000,
        position: [0, 3, 2]
    }}>
        <ambientLight />
        <pointLight position={[5, 5, 5]} />
        <PlayerComponent onFrameEvent={playerFrameEvent} playerModel={vrm} idolClip={idol} walkClip={walk} />
        <gridHelper />
    </Canvas>)
}