import * as THREE from 'three';
import type { Moment } from '../../data/moments';
import { generateLayout, type LayoutConfig } from './LayoutGenerator';
import { PhotoNode } from './PhotoNode';

export class PhotoManager {
  readonly nodes: PhotoNode[] = [];

  constructor(
    private scene: THREE.Scene,
    moments: Moment[],
    layoutConfig: LayoutConfig,
  ) {
    const layout = generateLayout({ ...layoutConfig, count: moments.length });
    moments.forEach((moment, index) => {
      const node = new PhotoNode(moment, layout[index]);
      this.nodes.push(node);
      this.scene.add(node.mesh);
    });
  }

  update(deltaTime: number, elapsedTime: number, camera: THREE.Camera, distanceThreshold = 8): void {
    for (const node of this.nodes) {
      node.update(deltaTime, elapsedTime);
      node.faceCamera(camera, distanceThreshold);
    }
  }
}
