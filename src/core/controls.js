import { OrbitControls } from "three/addons/controls/OrbitControls.js";
export function createControls(camera, element) {
  const orbit = new OrbitControls(camera, element);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.075;
  orbit.enablePan = true;
  orbit.minDistance = 1;
  orbit.maxDistance = 1200;
  orbit.zoomSpeed = 0.8;
  orbit.rotateSpeed = 0.55;
  orbit.maxPolarAngle = Math.PI * 0.98;
  return orbit;
}
