import * as THREE    from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js';

const photoWrap = document.querySelector('.gallery-photo-wrap');
const thumbsEl  = document.getElementById('gallery-thumbs');
const viewer3d  = document.getElementById('gallery-3d');

document.querySelectorAll('.gtoggle').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gtoggle').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.view === 'model') {
      photoWrap.style.display  = 'none';
      thumbsEl.style.display   = 'none';
      viewer3d.classList.add('active');
      initViewer();
    } else {
      photoWrap.style.display  = '';
      thumbsEl.style.display   = '';
      viewer3d.classList.remove('active');
    }
  });
});

let viewerReady = false;
let renderer, scene, camera, controls, meshGroup;
let wireframeOn = true, autoRotate = true;

function initViewer() {
  if (viewerReady) return;
  viewerReady = true;

  const modelPath = PRODUCT.modelPath;
  const canvas    = document.getElementById('model-canvas');
  const loading   = document.getElementById('model-loading');
  const errMsg    = document.getElementById('model-err');
  const W = () => viewer3d.clientWidth;
  const H = () => viewer3d.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070503);
  scene.fog = new THREE.Fog(0x070503, 8, 22);

  camera = new THREE.PerspectiveCamera(40, W()/H(), 0.05, 50);
  camera.position.set(0, 0.6, 4.2);

  renderer = new THREE.WebGLRenderer({canvas, antialias:true});
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled   = true;
  renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  scene.add(new THREE.AmbientLight(0x2a2010, 2.0));
  const key = new THREE.DirectionalLight(0xf0d060, 3.5);
  key.position.set(3, 4, 2.5); key.castShadow = true; key.shadow.mapSize.set(1024,1024);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfd6dc, 1.0); fill.position.set(-3,-1,2); scene.add(fill);
  const rim  = new THREE.DirectionalLight(0xe8c547, 0.9); rim.position.set(0,-4,-3);  scene.add(rim);

  const goldMat = new THREE.MeshStandardMaterial({color:0xc0961e, metalness:0.92, roughness:0.08});
  const wireMat = new THREE.LineBasicMaterial({color:0xe8c547, transparent:true, opacity:0.28, depthTest:true});

  const floor = new THREE.Mesh(new THREE.CircleGeometry(3,64), new THREE.ShadowMaterial({opacity:0.35}));
  floor.rotation.x = -Math.PI/2; floor.position.y = -1.2; floor.receiveShadow = true;
  scene.add(floor);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.06;
  controls.minDistance = 1.0; controls.maxDistance = 10;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.7;
  controls.addEventListener('start', () => { controls.autoRotate = autoRotate; });

  meshGroup = new THREE.Group(); scene.add(meshGroup);

  function loadOBJ(materials) {
    const obj = new OBJLoader();
    if (materials) { materials.preload(); obj.setMaterials(materials); }
    obj.load(modelPath, loaded => {
      const box  = new THREE.Box3().setFromObject(loaded);
      const ctr  = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const sc   = 2.2 / Math.max(size.x, size.y, size.z);
      loaded.position.copy(ctr.negate().multiplyScalar(sc));
      loaded.scale.setScalar(sc);
      loaded.traverse(child => {
        if (!child.isMesh) return;
        child.material = goldMat; child.castShadow = true;
        const wire = new THREE.LineSegments(new THREE.WireframeGeometry(child.geometry), wireMat);
        wire.name = 'wireframe'; child.add(wire);
      });
      meshGroup.add(loaded);
      loading.classList.add('done');
    }, null, () => {
      loading.classList.add('done'); errMsg.classList.add('show');
      document.querySelector('.model-spinner').style.display = 'none';
    });
  }

  new MTLLoader().load(modelPath.replace(/\.obj$/i,'.mtl'), m => loadOBJ(m), null, () => loadOBJ(null));

  (function animate(){ requestAnimationFrame(animate); controls.update(); renderer.render(scene,camera); })();

  new ResizeObserver(() => {
    if (!viewer3d.classList.contains('active')) return;
    camera.aspect = W()/H(); camera.updateProjectionMatrix(); renderer.setSize(W(),H());
  }).observe(viewer3d);
}

document.getElementById('model-wireframe-btn').addEventListener('click', () => {
  wireframeOn = !wireframeOn;
  document.getElementById('model-wireframe-btn').classList.toggle('off', !wireframeOn);
  if (meshGroup) meshGroup.traverse(c => { if (c.name==='wireframe') c.visible = wireframeOn; });
});

document.getElementById('model-rotate-btn').addEventListener('click', () => {
  autoRotate = !autoRotate;
  document.getElementById('model-rotate-btn').classList.toggle('off', !autoRotate);
  if (controls) controls.autoRotate = autoRotate;
});
