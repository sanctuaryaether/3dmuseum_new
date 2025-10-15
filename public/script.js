import * as THREE from './libs/three/build/three.module.js';
import { OrbitControls } from './libs/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from './libs/three/examples/jsm/loaders/GLTFLoader.js';

// Postprocessing
import { EffectComposer } from './libs/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './libs/three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './libs/three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './libs/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from './libs/three/examples/jsm/postprocessing/BokehPass.js';
import { FilmPass } from './libs/three/examples/jsm/postprocessing/FilmPass.js';
import { SMAAPass } from './libs/three/examples/jsm/postprocessing/SMAAPass.js';

// Shaders
import { GammaCorrectionShader } from './libs/three/examples/jsm/shaders/GammaCorrectionShader.js';
import { RGBShiftShader } from './libs/three/examples/jsm/shaders/RGBShiftShader.js';

import { DRACOLoader } from './libs/three/examples/jsm/loaders/DRACOLoader.js';





let bokehPass; // declaración global


let scene, camera, renderer, controls, composer, bloomPass;
let model;
const container = document.getElementById('container');
let hoveredHotspot = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let depthTarget, dofPass;




const hotspots = [];
const positions = [
  new THREE.Vector3(55, 72, 160),
  new THREE.Vector3(-25, 72, 240),
  new THREE.Vector3(-9, 1, -2),
  new THREE.Vector3(3, 1, 6),
  new THREE.Vector3(4, 1, 14),
];

// 🚀 Iniciar correctamente todo el flujo
async function main() {
  await loadHotspotData(); // 1️⃣ Espera datos del backend

  init();                  // 2️⃣ Inicializa escena, cámara y renderer

  createHotspots();        // 3️⃣ Crea los hotspots con los datos cargados

  animate();               // 4️⃣ Empieza a renderizar
}

main(); // <-- Esto lanza todo correctamente



function init() {
  // Get loading screen elements
  const loadingScreen = document.getElementById('loading-screen');
  const modelContainer = document.getElementById('container'); // Use #container instead of #model-container

  // Scene and camera
  scene = new THREE.Scene();

  // Initial camera (near/far planes will be adjusted after model load)
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
  camera.position.set(0, 10, 30);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // FONDO completamente blanco
renderer.setClearColor(0xffffff, 1);

// 🎨 Configuración correcta del renderer (colocar justo después de su creación)
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding;

// Importante si usas EffectComposer:
renderer.autoClear = false;


// Crear el pass


// Corrección de color
renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.outputEncoding = (THREE.sRGBEncoding) ? THREE.sRGBEncoding : THREE.LinearEncoding;
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
  scene.add(hemi);

  const dirLight = new THREE.DirectionalLight(0xffffff, 5);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.enablePan = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 1000;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2 - 0.01;
  controls.update();

  // Debug camera position
  controls.addEventListener('change', () => {
    const pos = camera.position;
    const tgt = controls.target;
    console.clear();
    console.log(`camera.position.set(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)});`);
    console.log(`controls.target.set(${tgt.x.toFixed(3)}, ${tgt.y.toFixed(3)}, ${tgt.z.toFixed(3)});`);
  });

  // Mobile touch adjustments
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.screenSpacePanning = true;
  }

const dracoLoader = new DRACOLoader();

// 📂 Ruta a los decoders Draco (binarios o WASM)
dracoLoader.setDecoderPath('./libs/three/examples/jsm/libs/draco/');

// Opcional: usa WASM si lo tienes
// dracoLoader.setDecoderConfig({ type: 'js' }); // o 'wasm'

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Luego cargas normalmente
loader.load(
  '/modelo_draco.glb',
  (gltf) => {
    model = gltf.scene;
    model.scale.set(1, 1, 1);
    scene.add(model);

      const focusDistance = camera.position.distanceTo(controls.target);
console.log("🎯 Focus automático:", focusDistance);
bokehPass.materialBokeh.uniforms.focus.value = focusDistance;

      scene.traverse(o => {
  if (o.isMesh) {
    o.material.depthWrite = true;
    o.material.depthTest = true;
  }
});


      scene.traverse(obj => {
  if (obj.material) {
    obj.material.depthWrite = true;
    obj.material.depthTest = true;
  }
});


      // Calculate bounding box/sphere
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const radius = sphere.radius;
      const maxDim = Math.max(size.x, size.y, size.z);

      // Center model at origin
      model.position.sub(center);

      // Adjust camera near/far
      camera.near = Math.max(0.0005, maxDim * 1e-4);
      camera.far = Math.max(1000, maxDim * 50);
      camera.updateProjectionMatrix();

      // Custom camera position
      camera.position.set(47.350, 109.799, 200.283);
      controls.target.set(78.407, 1.256, 95.913);  
      camera.lookAt(controls.target);

      // Adjust OrbitControls
      controls.minDistance = Math.max(0.01, radius * 0.03);
      controls.maxDistance = Math.max(radius * 0.2, maxDim * 0.003);
      controls.maxPolarAngle = Math.PI / 2 - 0.005;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.update();

      // Hide loading screen
      if (loadingScreen && modelContainer) {
        loadingScreen.style.display = 'none';
        modelContainer.classList.add('loaded');
      }

      console.log('✅ Model loaded and camera applied.');
      console.log('Model size:', size);
      console.log('Bounding radius:', radius);
    },
    undefined,
    (error) => {
      console.error('Error loading model:', error);
    }
  );

  // Window resize
  window.addEventListener('resize', onWindowResize);


  // Asegura que el renderer use la corrección y exposición correctas
renderer.toneMapping = THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 0.5; // o el valor que te guste
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.autoClear = false; // necesario para EffectComposer


// ---- POST-PROCESADO LIMPIO ----

composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 🌟 Bloom
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.2,  // intensidad
  0.4,  // radio
  0.85  // umbral
);
composer.addPass(bloomPass);

bokehPass = new BokehPass(scene, camera, {
  focus: 200,
  aperture: 0.000075,
  maxblur: 0.02,
});
composer.addPass(bokehPass);


// 🎞️ Film
const filmPass = new FilmPass(0.15, 0.025, 648, false);
composer.addPass(filmPass);

// 🌈 Aberración cromática
const chromaPass = new ShaderPass(RGBShiftShader);
chromaPass.uniforms.amount.value = 0.002;
composer.addPass(chromaPass);

// 🧊 Anti-aliasing
const smaaPass = new SMAAPass(
  window.innerWidth * renderer.getPixelRatio(),
  window.innerHeight * renderer.getPixelRatio()
);
composer.addPass(smaaPass);



// ⚙️ Renderer setup final
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2; // sube a 1.5 para más brillo en bloom
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.autoClear = false;

// 💡 Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(10, 20, 10);
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
fillLight.position.set(-10, 5, -5);
scene.add(fillLight);


}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // No renderizamos depthTarget (hemos quitado DOF)
  // Solo render normal vía composer
  composer.render();
}

function createHotspots() {
  positions.forEach((pos, i) => {
    const sprite = createQuestionSprite();
    sprite.position.copy(pos);
    sprite.userData.originalPosition = pos.clone();
    sprite.name = `hotspot-${i}`;
    scene.add(sprite);
    hotspots.push(sprite);
  });
}

function createQuestionSprite() {
  const size = 18;
  const radius = 6;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '11px VT323, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('?', size / 2, size / 2 + 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 2, 2);
  return sprite;
}

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (!isMobile) {
  window.addEventListener('mousemove', onMouseMove, false);
}

window.addEventListener('click', onClick, false);
if (isMobile) {
  window.addEventListener('touchstart', onTouchStart, { passive: false });
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspots);

  if (intersects.length > 0) {
    const intersected = intersects[0].object;

    if (hoveredHotspot !== intersected) {
      if (hoveredHotspot) {
        gsap.to(hoveredHotspot.scale, { x: 3, y: 3, z: 3, duration: 0.3, ease: "power2.out" });
        gsap.to(hoveredHotspot.position, {
          x: hoveredHotspot.userData.originalPosition.x,
          y: hoveredHotspot.userData.originalPosition.y,
          z: hoveredHotspot.userData.originalPosition.z,
          duration: 0.2,
          ease: "bounce.out"
        });
      }

      hoveredHotspot = intersected;
      document.body.style.cursor = 'pointer';
      gsap.to(hoveredHotspot.scale, { x: 2.1, y: 2.1, z: 2.1, duration: 0.3, ease: "bounce.out" });
    }

    const intersectPoint = intersects[0].point;
    gsap.to(hoveredHotspot.position, {
      x: intersectPoint.x,
      y: intersectPoint.y,
      z: intersectPoint.z,
      duration: 0.1,
      ease: "none"
    });
  } else {
    if (hoveredHotspot) {
      gsap.to(hoveredHotspot.scale, { x: 2, y: 2, z: 2, duration: 0.3, ease: "power2.out" });
      gsap.to(hoveredHotspot.position, {
        x: hoveredHotspot.userData.originalPosition.x,
        y: hoveredHotspot.userData.originalPosition.y,
        z: hoveredHotspot.userData.originalPosition.z,
        duration: 0.2,
        ease: "bounce.out"
      });
      hoveredHotspot = null;
      document.body.style.cursor = 'default';
    }
  }
}

function onClick(event) {
  event.preventDefault();

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspots);

  if (intersects.length > 0) {
    const hotspot = intersects[0].object;
    const index = parseInt(hotspot.name.split('-')[1]);
    showInfoPanel(index);
  }
}

function onTouchStart(event) {
  event.preventDefault();

  const touch = event.touches[0];
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(hotspots);

  if (intersects.length > 0) {
    const hotspot = intersects[0].object;
    const index = parseInt(hotspot.name.split('-')[1]);
    showInfoPanel(index);
  }
}
  

const infoPanel = document.getElementById('info-panel');
const infoImage = document.getElementById('info-image');
const infoTitle = document.getElementById('info-title');
const infoText = document.getElementById('info-text');
const closeBtn = document.getElementById('close-btn');

let hotspotData = [];

async function loadHotspotData() {
  try {
    const response = await fetch("https://3dmuseum-test.vercel.app/api/hotspots");

    hotspotData = await response.json();
    console.log("hotspot loaded:", hotspotData);
  } catch (error) {
    console.error("error:", error);
  }
}


function showInfoPanel(index) {
  const data = hotspotData[index];
  
  infoTitle.textContent = data.title;
  infoImage.src = data.image;
  infoText.innerHTML = data.text;

  const buttonContainer = document.getElementById('button-container');
  const scheduleContainer = document.getElementById('schedule-container');
  
  buttonContainer.innerHTML = '';  
  scheduleContainer.innerHTML = ''; 

  if (index === 3) {
    const button = document.createElement('a');
    button.href = 'https://tickets.museummoddergat.nl/wadlopen/#/tickets/entrance-tickets';  
    button.classList.add('btn-reserve');  
    button.textContent = 'Reserveer nu'; 
    buttonContainer.appendChild(button);
    
    const schedule = document.createElement('div');
    schedule.innerHTML = data.schedule; 
    scheduleContainer.appendChild(schedule);
  }
  
  infoPanel.classList.add('visible');
}

closeBtn.addEventListener('click', () => {
  infoPanel.classList.remove('visible');
}); 

