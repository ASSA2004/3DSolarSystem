import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FlyControls } from "three/addons/controls/FlyControls.js";

export function createControls(camera, domElement) {
  const orbit = new OrbitControls(camera, domElement);
  orbit.enableDamping = true;
  orbit.dampingFactor = .06;
  orbit.minDistance = 8;
  orbit.maxDistance = 260;
  const fly = new FlyControls(camera, domElement);
  fly.movementSpeed = 48;
  fly.rollSpeed = Math.PI / 12;
  fly.dragToLook = true;
  fly.enabled = false;
  let orbitMode = true;
  return {
    orbit, fly,
    get orbitMode() { return orbitMode; },
    toggle() {
      orbitMode = !orbitMode;
      orbit.enabled = orbitMode;
      fly.enabled = !orbitMode;
      return orbitMode;
    },
    update(delta) { orbitMode ? orbit.update() : fly.update(delta); }
  };
}
