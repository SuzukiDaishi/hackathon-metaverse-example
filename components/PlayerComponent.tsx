import React, { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { ThreeElements, useThree, useFrame } from '@react-three/fiber'
import { VRM, VRMUtils } from '@pixiv/three-vrm'
import CameraControls from 'camera-controls'

// カメラコントロールの初期化
CameraControls.install({ THREE: THREE })

/**
 * Playerコンポーネントの引数の型
 */
type PlayrProps = {
    playerModel: VRM | undefined,                    // 操作するVRMモデル
    idolClip: THREE.AnimationClip | undefined,       // 何もしていない時のモーション
    walkClip: THREE.AnimationClip | undefined,       // 歩いているときのモーション
    onFrameEvent: (player: VRM) => void | undefined, // フレームの動作
} & ThreeElements['mesh']                            // ThreeElements.primitiveの引数

/**
 * プレイヤーの動作一覧の型
 */
type PlayerActions = {
    idol: THREE.AnimationAction, // 何もしていない時のアクション
    walk: THREE.AnimationAction  // 歩いている時のアクション
}

/**
 * fromからtoを見た時の絶対角度(Y軸)
 * 
 * @param fromVec 見る方
 * @param toVec 見られる方
 * @returns Y軸の角度
 */
const getAngleY = (fromPos: THREE.Vector3, toPos: THREE.Vector3) => {
    const frontX = toPos.x - fromPos.x
    const frontZ = toPos.z - fromPos.z
    return Math.atan2(frontX, frontZ)
}

/**
 * 次に進むベクトルを算出
 * 
 * @param speed 速度
 * @param direction 方向
 * @param frontAngle 絶対的前
 * @param delta フレームあたりの秒
 * @returns フレームあたりに進むベクトル
 */
const getMoveDelta = (speed: number,
    direction: THREE.Vector3,
    frontAngle: number,
    delta: number): { moveDelta: THREE.Vector3, angle: number } => {
    const angle = Math.atan2(direction.x, direction.z) + frontAngle
    const angleX = Math.sin(angle)
    const angleZ = Math.cos(angle)
    return {
        moveDelta: new THREE.Vector3(speed * angleX * delta, 0, speed * angleZ * delta),
        angle
    }
}

/**
 * プレイヤーのコンポーネント
 * 
 * @param props 引数
 * @returns Three.jsのエレメント
 */
export const PlayerComponent: React.FC<PlayrProps> = (props: PlayrProps) => {

    // three.jsへのアクセス
    const {
        camera,
        gl: { domElement }
    } = useThree()

    // VRMモデルの定義
    const vrmRef = useRef<VRM>()

    // 速度
    const speed = useRef(0)

    // 方向
    const direction = useRef(new THREE.Vector3(0, 0, 1))

    // アニメーションの定義
    const actionsRef = useRef<PlayerActions>()
    const animationMixerRef = useRef<THREE.AnimationMixer>()

    // カメラコントロールの定義
    const cameraControlsRef = useRef<CameraControls>()

    // アバターの更新
    useEffect(() => {
        if (!props.playerModel) return
        if (vrmRef.current) VRMUtils.removeUnnecessaryJoints(vrmRef.current.scene)
        vrmRef.current = props.playerModel
        VRMUtils.deepDispose(vrmRef.current.scene)
        vrmRef.current.scene.traverse((obj) => { obj.frustumCulled = false })
        VRMUtils.rotateVRM0(vrmRef.current)
        
        // カメラの更新
        cameraControlsRef.current = new CameraControls(camera, domElement)
    }, [props.playerModel])

    // モーションの更新
    useEffect(() => {
        if (!props.idolClip || !props.walkClip) return
        if (vrmRef.current) {
            animationMixerRef.current = new THREE.AnimationMixer(vrmRef.current.scene)
            actionsRef.current = {
                idol: animationMixerRef.current.clipAction(props.idolClip),
                walk: animationMixerRef.current.clipAction(props.walkClip)
            }
            actionsRef.current.idol.play()
        }
    }, [props.playerModel, props.idolClip, props.walkClip])

    const frameEvent = useCallback(() => {
        if (vrmRef.current) props.onFrameEvent(vrmRef.current)
    }, [props.onFrameEvent]) 

    // キーを押した時の操作
    const keydownEvent = useCallback((event: KeyboardEvent) => {
        switch (event.key) {
            case 'w':
            case 'ArrowUp':
                direction.current = new THREE.Vector3(0, 0, 1)
                actionsRef.current?.walk.play()
                actionsRef.current?.idol.stop()
                speed.current = 1.5
                break
            case 'a':
            case 'ArrowLeft':
                direction.current = new THREE.Vector3(1, 0, 0)
                actionsRef.current?.walk.play()
                actionsRef.current?.idol.stop()
                speed.current = 1.5
                break
            case 'd':
            case 'ArrowRight':
                direction.current = new THREE.Vector3(-1, 0, 0)
                actionsRef.current?.walk.play()
                actionsRef.current?.idol.stop()
                speed.current = 1.5
                break
            case 's':
            case 'ArrowDown':
                direction.current = new THREE.Vector3(0, 0, -1)
                actionsRef.current?.walk.play()
                actionsRef.current?.idol.stop()
                speed.current = 1.5
                break
        }
    }, [props.playerModel, props.idolClip, props.walkClip])

    // キーを離した時の動作
    const keyupEvemt = useCallback((event: KeyboardEvent) => {
        switch (event.key) {
          case 'w':
          case 'ArrowUp':
          case 'a':
          case 'ArrowLeft':
          case 'd':
          case 'ArrowRight':
          case 's':
          case 'ArrowDown':
            actionsRef.current?.idol.play()
            actionsRef.current?.walk.stop()
            speed.current = 0
            break
        }
      }, [props.idolClip, props.walkClip])

      useEffect(() => {
        document.addEventListener('keydown', keydownEvent, false)
        document.addEventListener('keyup', keyupEvemt, false)
      }, [props.playerModel, props.idolClip, props.walkClip])

    // フレーム毎に実行
    useFrame((state, delta) => {
        
        if (cameraControlsRef.current && vrmRef.current) {

            // プレイヤーの動作
            const front = getAngleY(cameraControlsRef.current.camera.position, vrmRef.current.scene.position)
            const { moveDelta, angle } = getMoveDelta(speed.current, direction.current, front, delta)
            vrmRef.current.scene.position.x += moveDelta.x
            vrmRef.current.scene.position.y += moveDelta.y
            vrmRef.current.scene.position.z += moveDelta.z
            if (speed.current > 0) vrmRef.current.scene.rotation.y = angle - Math.PI

            // カメラの動作
            cameraControlsRef.current.camera.position.x += moveDelta.x
            cameraControlsRef.current.camera.position.y += moveDelta.y
            cameraControlsRef.current.camera.position.z += moveDelta.z
            cameraControlsRef.current.setOrbitPoint(vrmRef.current.scene.position.x,
                vrmRef.current.scene.position.y + 1,
                vrmRef.current.scene.position.z)
        }

        frameEvent()

        // 諸々のアップデート
        vrmRef.current?.update(delta)
        animationMixerRef.current?.update(delta)
        cameraControlsRef.current?.update(delta)
    })

    // VRMの読み込みがなければ表示しない
    if (!vrmRef.current) return null

    return <primitive {...props} object={vrmRef.current.scene} dispose={null} />
}