import * as THREE from 'three';
import type { PhotoNode } from '../photos/PhotoNode';

export interface PickEvent {
  clientX: number;
  clientY: number;
  target?: unknown;
}

export class Raycaster {
  private readonly raycaster = new THREE.Raycaster();

  pick(event: PickEvent, camera: THREE.Camera, nodes: PhotoNode[]): PhotoNode | null {
    const el = event.target as { clientWidth?: number; clientHeight?: number } | null | undefined;
    const width = el?.clientWidth || 1;
    const height = el?.clientHeight || 1;

    const ndc = new THREE.Vector2((event.clientX / width) * 2 - 1, -(event.clientY / height) * 2 + 1);

    camera.updateMatrixWorld();
    this.raycaster.setFromCamera(ndc, camera);

    for (const node of nodes) {
      node.mesh.updateWorldMatrix(true, false);
    }
    const meshToNode = new Map<THREE.Object3D, PhotoNode>(nodes.map((n) => [n.mesh, n]));
    const hits = this.raycaster.intersectObjects(Array.from(meshToNode.keys()), false);

    return hits.length > 0 ? (meshToNode.get(hits[0].object) ?? null) : null;
  }
}
