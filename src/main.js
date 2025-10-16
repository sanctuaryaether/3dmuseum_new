// src/main.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader.js';
import gsap from "gsap";




let bokehPass; 


let scene, camera, renderer, controls, composer, bloomPass;
let model;
const container = document.getElementById('container');
let hoveredHotspot = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let depthTarget, dofPass;




const hotspots = [];
const positions = [
  new THREE.Vector3(-55, 75, -160),
  new THREE.Vector3(-43, 78, -196),
  new THREE.Vector3(40, 75, -180),
  new THREE.Vector3(-47, 75, -147),
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
  const loadingScreen = document.getElementById('loading-screen');
  const modelContainer = document.getElementById('container');

  // === ESCENA Y CÁMARA ===
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 2000);
  camera.position.set(0, 10, 30);

  // === RENDERER ===
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xf0f0f0, 1); // 🌤️ Fondo claro

  // ✅ Corrección de color y exposición
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ReinhardToneMapping;  // 🌈 Menos contraste, tonos más suaves
  renderer.toneMappingExposure = 1.5;                // 🔆 Aclara tonos medios

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;

  container.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  // === LUCES ===
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.6);
  sunLight.position.set(10, 20, 10);
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-10, 5, -5);
  scene.add(fillLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
  scene.add(ambientLight);

  // === CONTROLES ===
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.1;
  controls.maxDistance = 1000;
  controls.maxPolarAngle = Math.PI / 2 - 0.01;
  controls.update();

  // === CARGA DE MODELO ===
  const loader = new GLTFLoader();
  loader.load(
    'modelo_gordo.glb',
    (gltf) => {
      model = gltf.scene;
      model.scale.set(1, 1, 1);
      scene.add(model);

      // Asegura que todos los materiales escriban en el z-buffer
      scene.traverse(o => {
        if (o.isMesh) {
          o.material.depthWrite = true;
          o.material.depthTest = true;
        }
      });

      // Centrado y ajuste de cámara
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const radius = box.getBoundingSphere(new THREE.Sphere()).radius;

      model.position.sub(center);

      camera.near = Math.max(0.0005, size.length() * 1e-4);
      camera.far = Math.max(1000, size.length() * 50);
      camera.updateProjectionMatrix();

      camera.position.set(-36.827, 132.919, -225.702);
      controls.target.set(-83.925, 1.256, -84.597);
      camera.lookAt(controls.target);

      controls.minDistance = Math.max(0.01, radius * 0.03);
      controls.maxDistance = Math.max(radius * 0.2, size.length() * 0.003);
      controls.update();

      if (loadingScreen && modelContainer) {
        loadingScreen.style.display = 'none';
        modelContainer.classList.add('loaded');
      }

      console.log('✅ Model loaded and camera applied.');
    },
    undefined,
    (error) => console.error('Error loading model:', error)
  );

  window.addEventListener('resize', onWindowResize);

  // === POST-PROCESADO ===
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 💧 Bokeh leve (profundidad de campo)
  bokehPass = new BokehPass(scene, camera, {
    focus: 100,
    aperture: 0.00004,
    maxblur: 0.03,
  });
  composer.addPass(bokehPass);

  
// Resolución del efecto (usa el tamaño de la ventana)
const bloomParams = {
  threshold: 1,  // brillo mínimo que genera bloom
  strength: 0.7,   // intensidad del brillo
  radius: 0.1      // dispersión del resplandor
};

// El vector define el tamaño del render buffer para el bloom
bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  bloomParams.strength,
  bloomParams.radius,
  bloomParams.threshold
);

composer.addPass(bloomPass);

  // 🎞️ FilmPass (granulado sutil)
  composer.addPass(new FilmPass(0.07, 0.025, 648, false));

  // 🌈 Aberración cromática leve
  const chromaPass = new ShaderPass(RGBShiftShader);
  chromaPass.uniforms.amount.value = 0.0015;
  composer.addPass(chromaPass);

  // 🎨 Color Correction — mejora leve de tonos medios
  const colorCorrection = new ShaderPass(ColorCorrectionShader);
  colorCorrection.uniforms['powRGB'].value = new THREE.Vector3(.3, .3 ,.3); // gamma neutra
  colorCorrection.uniforms['mulRGB'].value = new THREE.Vector3(1.1, 1, 1.0); // brillo leve
  composer.addPass(colorCorrection);

  // 🧼 Anti-aliasing
  const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );
  composer.addPass(smaaPass);
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
  sprite.scale.set(3, 3, 3);
  return sprite;
}
window.addEventListener('click', onClick, false);


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
      gsap.to(hoveredHotspot.scale, { x: 3.1, y: 3.1, z: 3.1, duration: 0.3, ease: "bounce.out" });
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
      gsap.to(hoveredHotspot.scale, { x: 3, y: 3, z: 3, duration: 0.3, ease: "power2.out" });
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
    // fetch relativo, Vite se encarga del proxy
    const response = await fetch("/api/hotspots");

    if (!response.ok) {
      console.error("Error en la respuesta del servidor:", response.status, response.statusText);
      const text = await response.text();
      console.error("Contenido devuelto:", text);
      return;
    }

    hotspotData = await response.json(); // ✅ aquí recibimos JSON real
    console.log("Hotspots cargados:", hotspotData);

  } catch (error) {
    console.error("Error al cargar hotspots:", error);
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

