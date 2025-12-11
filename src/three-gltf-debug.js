
//import * as THREE from 'three';
import * as THREE from '../../three.js/build/three.webgpu.js';

// Call once per model after you add it to the scene:
export function makeTextureDebugger(root) {
  
  // Stash original materials in the userData:
  root.traverse(o => {
    if (o.isMesh && o.material && !o.userData._origMat) {
      //const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.userData._origMat = o.material;
    }
  });


  function applyForEachMesh(makeMat) {
    //restore();
    root.traverse(o => {
      if (!o.isMesh) return;
      // const mats = Array.isArray(o.material) ? o.material : [o.material];
      // const newMats = mats.map(m => makeMat(m) || m);


        if (Array.isArray(o.userData._origMat)) {
          // @@
        }
        else {
          if (o.material != o.userData._origMat) {
            //o.material.dispose();
          }
          o.material = makeMat(o.material) || o.material;
          o.material.needsUpdate = true;          
        }

    /*
        const originalMats = o.userData._origMat;
        
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        if (!sameMaterials(mats, originalMats)) {
          //for (const m of mats) m?.dispose();  
        }
        o.material = o.userData._origMat;

        o.material.map(m => makeMat(m) || m);
        for (const m of o.material) if (m?.isMaterial) m.needsUpdate = true; // @@ is this necessary?
    */

      /*if (Array.isArray(o.material)) {
        const oldMats = o.userData._origMat;
        o.material.map(m => makeMat(m) || m);
        for (const m of o.material) if (m?.isMaterial) m.needsUpdate = true;  
        for (const m of oldMats) m?.dispose();
      }
      else {
        const oldMat = o.material;
        o.material = makeMat(o.material);
        o.material.needsUpdate = true;

        ["map","normalMap","metalnessMap","roughnessMap","aoMap","emissiveMap","specularMap","alphaMap","envMap"]
        .forEach(k => {
          const t = oldMat[k];
          if (t && t.isTexture && !t.isExternalTexture) t.dispose();
        });

        oldMat.dispose();
      }*/
    });
  }

  function texOrNull(m, key) {
    return m && m[key] && m[key].isTexture ? m[key] : null;
  }

  // Cleanup original material:
  function remove() {
    restore();
    root.traverse(o => {
      if (!o.isMesh || !o.userData._origMat) return;
      delete o.userData._origMat;
    });
  }

  // ---- Views ----
  function showBaseColor() {
    applyForEachMesh(m => {
      const t = texOrNull(m, 'map');
      //if (!t) return null;
      const mat = new THREE.MeshBasicMaterial({ map: t });
      // Ensure correct color space for display
      if (t && t.colorSpace !== THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return mat;
    });
  }

  function showNormalMap() {
    applyForEachMesh(m => {
      const t = texOrNull(m, 'normalMap');
      //if (!t) return null;
      const mat = new THREE.MeshBasicMaterial({ map: t });
      // Normal maps are linear data; make sure they're not treated as sRGB
      if (t && t.colorSpace !== THREE.LinearSRGBColorSpace) t.colorSpace = THREE.LinearSRGBColorSpace;
      return mat;
    });
  }

  function showRoughness() {
    applyForEachMesh(m => {
      const t = texOrNull(m, 'roughnessMap');
      //if (!t) return null;
      const mat = new THREE.MeshBasicMaterial({ map: t });
      if (t && t.colorSpace !== THREE.LinearSRGBColorSpace) t.colorSpace = THREE.LinearSRGBColorSpace;
      return mat;
    });
  }

  function showMetallic() {
    applyForEachMesh(m => {
      const t = texOrNull(m, 'metalnessMap');
      //if (!t) return null;
      const mat = new THREE.MeshBasicMaterial({ map: t });
      if (t && t.colorSpace !== THREE.LinearSRGBColorSpace) t.colorSpace = THREE.LinearSRGBColorSpace;
      return mat;
    });
  }

  function showOcclusion() {
    applyForEachMesh(m => {
      const t = texOrNull(m, 'aoMap'); 
      //if (!t) return null;
      const mat = new THREE.MeshBasicMaterial({ map: t });
      if (t && t.colorSpace !== THREE.LinearSRGBColorSpace) t.colorSpace = THREE.LinearSRGBColorSpace;
      return mat;
    });
  }

  function showEmissive() {
    applyForEachMesh(m => {
      const t = texOrNull(m, 'emissiveMap');
      //if (!t) return null;
      const mat = new THREE.MeshBasicMaterial({ map: t });
      // Emissive textures are authored in sRGB in most pipelines
      if (t && t.colorSpace !== THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
      return mat;
    });
  }

  function restore() {
    root.traverse(o => {
      if (!o.isMesh || !o.userData._origMat) return;
      //o.material = Array.isArray(o.material) ? o.userData._origMat : o.userData._origMat[0];
      o.material = o.userData._origMat;

      if (Array.isArray(o.material)) {
        for (const m of o.material) if (m && m.isMaterial) m.needsUpdate = true;
      } else if (o.material && o.material.isMaterial) {
        o.material.needsUpdate = true;
      }
    });
  }

  return { showBaseColor, showNormalMap, showRoughness, showMetallic, showOcclusion, showEmissive, restore, remove };
}
