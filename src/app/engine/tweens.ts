import { Vector3, Euler, Fog, IFog, Quaternion } from "three";

import TWEEN from '@tweenjs/tween.js';


const speed = 1;

export module Tweens {

  export function timeout(time: number): Promise<void> {
    time /= speed;
    // return new Promise(resolve => {
    //   new TWEEN.Tween({ x: 0 }).to({ x: 1 }, time)
    //     .easing(TWEEN.Easing.Linear.None).start(now())
    //     .onComplete( () => {
    //       resolve();
    //     });
    // });
    return new Promise(resolve => setTimeout(() => resolve(), time));
  }

  export function playTween(tween: any): Promise<void> {
    return new Promise(resolve => {
      tween.start(now()).onComplete(() => resolve());
    });
  }


  export function randomizeFogTransition(near: number, far: number): { near: number, far: number, duration: number } {

    const near1 = Math.floor(Math.random() * 400);

    const diff1 = Math.abs(2200 - near1);

    const far1 = Math.floor(Math.random() * diff1) + near1;

    const diff2 = Math.abs(near - near1);

    const diff3 = Math.abs(far - far1);

    const max = diff2 > diff3 ? diff2 : diff3;

    const time = Math.floor(Math.random() * 20000) + max * 25;

    return {
      duration: time,
      far: far1,
      near: near1
    }

  }


  export function fogEffect(ifog: IFog): any {
    const fog = ifog as Fog;
    const values = randomizeFogTransition(fog.near, fog.far);

    return new TWEEN.Tween(fog as any).to({ far: values.far, near: values.near }, values.duration)
      .easing(TWEEN.Easing.Linear.None);

  }


  export function moveY(vec3: Vector3, y: number, time: number, delay: number = 0) {
    time /= speed;
    delay /= speed;

    return new TWEEN.Tween(vec3 as any).to({ y: vec3.y + y }, time)
      .easing(TWEEN.Easing.Linear.None).delay(delay).start(now());
  }


  export function move(vec3: Vector3, x: number, time: number, delay: number = 0) {
    time /= speed;
    delay /= speed;
    return new TWEEN.Tween(vec3 as any).to({ x: vec3.x + x }, time)
      .easing(TWEEN.Easing.Linear.None).delay(delay).start(now());
  }

  export async function transitVec3(vec1: Vector3, vec2: Vector3, time: number, delay: number = 0) {

    time /= speed;
    delay /= speed;
    const tween = new TWEEN.Tween(vec1 as any).to(vec2 as any, time)
      .easing(TWEEN.Easing.Exponential.InOut).delay(delay).start(now());

    return new Promise(resolve => tween.onComplete(resolve));
  }


  export async function transitQuat(quat1: Quaternion, quat2: Quaternion, time: number, delay: number = 0) {

    time /= speed;
    delay /= speed;
    const tween = new TWEEN.Tween(quat1 as any).to(quat2 as any, time)
      .easing(TWEEN.Easing.Exponential.InOut).delay(delay).start(now());

    return new Promise(resolve => tween.onComplete(resolve));
  }


  export function rotate(vec3: Vector3 | Euler, direction: number, time: number, delay: number = 0) {
    time /= speed;
    delay /= speed;
    return new TWEEN.Tween(vec3 as any).to({ z: vec3.z + direction * Math.PI / 2 }, time)
      .easing(TWEEN.Easing.Sinusoidal.Out).delay(delay).start(now());
  }

  // export function copyRotation(vec3: Vector3 | Euler, toVec3: Vector3 | Euler, time: number) {

  //   return new TWEEN.Tween(vec3).to({ x: toVec3.x, y: toVec3.y, z: toVec3.z }, time )
  //     .easing(TWEEN.Easing.Sinusoidal.Out).start(now());
  // }

  export function fall(vec3: Vector3, y: number, time: number, delay: number = 0) {
    time /= speed;
    delay /= speed;
    const tween = new TWEEN.Tween(vec3 as any).to({ y: y }, time)
      .easing(TWEEN.Easing.Linear.None).delay(delay).start(now());
    (tween as any)._valuesStart.y = vec3.y; // fix tween bug ?
    return tween;
  }


  export function fallWithBounce(vec3: Vector3, y: number, time: number, delay: number = 0) {
    time /= speed;
    delay /= speed;
    return new TWEEN.Tween(vec3 as any).to({ y: y }, time)
      .easing(TWEEN.Easing.Bounce.Out).delay(delay).start(now());
  }



  // export function resume(tween: any) {
  //   if (!_pausedTime) return;
  //   let diff = _pausedTime - _startTime;

  //   if (_duration - diff <= 0) return;
  //   _duration -= diff;
  //   _pausedTime = null;
  //   return start(now());
  // }

  // export function timeline(tweens: Array<any>) {
  //   let timeline = new Timeline(tweens);
  //   return timeline.start(now());
  // }


  export function animateLightPath(scale: Vector3, position: Vector3, distance: number, time: number) {
    time /= speed;
    new TWEEN.Tween(position as any).to({ y: position.y - distance / 2 }, time)
      .easing(TWEEN.Easing.Linear.None).start(now());

    new TWEEN.Tween(scale as any).to({ y: distance }, time)
      .easing(TWEEN.Easing.Linear.None).start(now());

    new TWEEN.Tween(position as any).to({ y: position.y - distance }, time)
      .easing(TWEEN.Easing.Linear.None).delay(time).start(now());

    return new TWEEN.Tween(scale as any).to({ y: 0 }, time)
      .easing(TWEEN.Easing.Linear.None).delay(time).start(now());

  }


  // export function isRunning(): boolean {
  //   return isRunning();
  // }

  export const now = () => {
    return TWEEN.now();
  }

  export function update(): void {
    TWEEN.update(now());
  }

  export function rotateHeptagon(vec3: Vector3 | Euler, direction: number, time: number, delay: number = 0) {
    return new TWEEN.Tween(vec3 as any).to({ y: vec3.y + direction * 0.8976 }, time)
      .easing(TWEEN.Easing.Sinusoidal.Out).delay(delay).start(now());
  }


}
