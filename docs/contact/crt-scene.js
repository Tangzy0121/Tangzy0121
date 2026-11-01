import * as THREE from './vendor/three.module.min.js';

// Original CRT models, screen artwork and camera blocking; no game assets.
export function createCrtScene(mount, { onSelect, onComplete }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.dataset.renderer = 'three-webgl';
  mount.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#11121b');
  scene.fog = new THREE.Fog('#11121b', 10, 25);
  const camera = new THREE.PerspectiveCamera(35, 1, .08, 60);
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const screens = [], pickable = [], materials = [], textures = [], geometries = [];
  let frame = 0, start = 0, running = false, ready = false, lastTexture = -1, elapsed = 0, hover = null;
  const DURATION = 4.4;
  const end = new THREE.Vector3(), heroTarget = new THREE.Vector3(-1.32, .92, 1.31);
  const centerTarget = new THREE.Vector3(0, 1.65, .1);
  const smooth = x => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const color = hex => new THREE.Color(hex);
  function mat(options) { const value = new THREE.MeshStandardMaterial(options); materials.push(value); return value; }
  const shell = mat({ color: '#403c48', roughness: .47, metalness: .16 });
  const shellLight = mat({ color: '#5b505e', roughness: .5, metalness: .1 });
  const shellDark = mat({ color: '#343641', roughness: .56, metalness: .18 });
  const trim = mat({ color: '#12131a', roughness: .35, metalness: .25 });
  const rubber = mat({ color: '#111018', roughness: .9 });
  const metal = mat({ color: '#91909d', metalness: .65, roughness: .3 });
  const knobMat = mat({ color: '#a79ba9', roughness: .35, metalness: .45 });
  function rounded(w, h, d, r, segments = 6) {
    const g = new THREE.BoxGeometry(w, h, d, segments, segments, segments);
    const p = g.attributes.position, n = g.attributes.normal;
    const point = new THREE.Vector3(), clamped = new THREE.Vector3(), normal = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      point.fromBufferAttribute(p, i);
      clamped.set(THREE.MathUtils.clamp(point.x, -w / 2 + r, w / 2 - r), THREE.MathUtils.clamp(point.y, -h / 2 + r, h / 2 - r), THREE.MathUtils.clamp(point.z, -d / 2 + r, d / 2 - r));
      normal.subVectors(point, clamped).normalize(); point.copy(clamped).addScaledVector(normal, r);
      p.setXYZ(i, point.x, point.y, point.z); n.setXYZ(i, normal.x, normal.y, normal.z);
    }
    geometries.push(g); return g;
  }
  function mesh(g, material, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(g, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(w, h, d, material, parent, x = 0, y = 0, z = 0, r = .05) { return mesh(rounded(w, h, d, Math.min(r, w / 3, h / 3, d / 3)), material, parent, x, y, z); }
  function cylinder(radius, depth, material, parent, x, y, z) {
    const g = new THREE.CylinderGeometry(radius, radius, depth, 28); g.rotateX(Math.PI / 2); geometries.push(g); return mesh(g, material, parent, x, y, z);
  }
  function screenGeometry(w, h) {
    const g = new THREE.PlaneGeometry(w, h, 36, 28), p = g.attributes.position;
    const radius = .14;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i);
      const cx = THREE.MathUtils.clamp(x, -w / 2 + radius, w / 2 - radius), cy = THREE.MathUtils.clamp(y, -h / 2 + radius, h / 2 - radius);
      const dx = x - cx, dy = y - cy, length = Math.hypot(dx, dy);
      if (length > radius) { x = cx + dx / length * radius; y = cy + dy / length * radius; }
      const z = .105 * Math.sqrt(Math.max(0, (1 - (x / (w / 2)) ** 2) * (1 - (y / (h / 2)) ** 2)));
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals(); geometries.push(g); return g;
  }
  function labelTexture(text, width = 512, height = 72) {
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#14151a'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c0b4c5'; ctx.font = '23px monospace'; ctx.textBaseline = 'middle'; ctx.fillText(text, 16, height / 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; textures.push(t); return t;
  }
  function label(text, parent, x, y, z, w = 1.4) {
    const map = labelTexture(text), material = mat({ map, roughness: .65 });
    const g = new THREE.PlaneGeometry(w, w * 72 / 512); geometries.push(g); return mesh(g, material, parent, x, y, z);
  }
  function television(key, tint, position, rotation, scale = 1, bodyMaterial = shell) {
    const group = new THREE.Group(); group.position.fromArray(position); group.rotation.set(0, rotation, key === 'github' ? -.035 : .018); group.scale.setScalar(scale); scene.add(group);
    box(2.58, 1.76, 1.05, bodyMaterial, group, 0, 0, .15, .15);
    box(2.13, 1.45, .9, shellDark, group, 0, .02, -.58, .15);
    box(2.35, 1.56, .15, trim, group, -.03, .015, .73, .065);
    box(1.98, 1.37, .12, rubber, group, -.145, .065, .81, .055);
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); textures.push(texture);
    const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }); materials.push(screenMaterial);
    const glassGeometry = screenGeometry(1.86, 1.25);
    const screen = mesh(glassGeometry, screenMaterial, group, -.145, .065, .888); screen.castShadow = false;
    const glassMaterial = new THREE.MeshPhysicalMaterial({ color: '#d8dbe8', metalness: .15, roughness: .14, transparent: true, opacity: .045, clearcoat: 1, clearcoatRoughness: .12, depthWrite: false }); materials.push(glassMaterial);
    const glass = mesh(glassGeometry, glassMaterial, group, -.145, .065, .897); glass.castShadow = false;
    const item = { key, tint, group, screen, material: screenMaterial, canvas, ctx: canvas.getContext('2d'), lit: false };
    screen.userData.station = item; screens.push(item);
    if (['email', 'qq', 'github'].includes(key)) pickable.push(screen);
    cylinder(.12, .09, knobMat, group, 1.04, .38, .87);
    cylinder(.095, .08, knobMat, group, 1.04, .04, .87);
    box(.018, .075, .02, trim, group, 1.04, .4, .928, .004);
    box(.014, .05, .02, trim, group, 1.04, .06, .923, .004);
    for (let i = 0; i < 6; i++) box(.18, .018, .02, rubber, group, 1.04, -.3 - i * .052, .825, .004);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) box(.012, .63, .025, rubber, group, side * 1.294, .05, .35 - i * .075, .003);
      for (const y of [-.72, .72]) cylinder(.026, .018, metal, group, side * 1.13, y, .817);
      for (const z of [-.35, .48]) box(.19, .1, .22, rubber, group, side * .9, -.92, z, .025);
    }
    label('TANGzy  /  ' + (key === 'email' ? '01' : key === 'qq' ? '02' : key === 'github' ? '03' : 'AUX'), group, -.17, -.675, .816, 1.52);
    const ledMat = mat({ color: tint, emissive: tint, emissiveIntensity: 1.5, roughness: .25 });
    cylinder(.026, .015, ledMat, group, .75, -.68, .839);
    return item;
  }
  const mail = television('email', '#f6b1d0', [-1.34, .94, .47], .12, 1, shellLight);
  television('qq', '#acd7eb', [1.34, .94, .1], -.15, 1, shell);
  television('github', '#c7b8f0', [.1, 2.76, -.03], .08, 1, shellDark);
  television('aux-a', '#a4bba3', [-3.04, 2.66, -1.25], .3, .55, shellDark);
  television('aux-b', '#b8a29b', [3.02, 2.61, -1.4], -.3, .55, shellDark);
  function speaker(x, height) {
    const group = new THREE.Group(); group.position.set(x, height / 2, -.55); group.rotation.y = x < 0 ? .15 : -.12; scene.add(group);
    box(.78, height, .78, trim, group, 0, 0, 0, .07);
    for (const [radius, y] of [[.27, -.3], [.19, .55]]) {
      cylinder(radius, .055, shellDark, group, 0, y, .42);
      const g = new THREE.TorusGeometry(radius * .84, .025, 8, 32); geometries.push(g); mesh(g, rubber, group, 0, y, .47);
      cylinder(radius * .64, .03, rubber, group, 0, y, .475);
      const domeG = new THREE.SphereGeometry(radius * .28, 16, 10); geometries.push(domeG); mesh(domeG, shellDark, group, 0, y, .5);
    }
  }
  speaker(-3.08, 2.1); speaker(3.11, 2.05);
  // Cables sit in real depth in front of and behind the housings.
  function cable(points) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 36, .025, 6, false); geometries.push(g); mesh(g, rubber, scene);
  }
  cable([[-2.1, .1, -.2], [-2.7, -.01, .8], [-.7, -.025, 2.1], [1.1, -.025, 1.8], [2, .1, .1]]);
  cable([[.6, 2.1, -.6], [1.1, 1.65, -.6], [2.5, .75, -.9], [3.5, 0, -.2]]);
  const floorCanvas = document.createElement('canvas'); floorCanvas.width = floorCanvas.height = 128;
  const floorCtx = floorCanvas.getContext('2d'); floorCtx.fillStyle = '#57515d'; floorCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { const x = (i * 79) % 128, y = (i * 47) % 128; floorCtx.fillStyle = i % 2 ? '#514c58' : '#605865'; floorCtx.fillRect(x, y, 1, 1); }
  const floorTexture = new THREE.CanvasTexture(floorCanvas); floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping; floorTexture.repeat.set(18, 18); textures.push(floorTexture);
  const floorG = new THREE.PlaneGeometry(70, 70); geometries.push(floorG);
  const floor = mesh(floorG, mat({ color: '#393542', roughness: .5, metalness: .22, bumpMap: floorTexture, bumpScale: .035 }), scene, 0, -.055, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false;
  box(70, 20, .2, mat({ color: '#22232d', roughness: .75 }), scene, 0, 9.9, -3.7, .03);
  for (let i = -3; i <= 3; i++) box(.012, 6, .015, trim, scene, i * 1.9, 3, -3.58, .003);
  label('TANGZY  /  PRIVATE FREQUENCY', scene, -.3, 4.1, -3.56, 5.2);
  scene.add(new THREE.HemisphereLight('#e6dcf2', '#343448', 1.05));
  const keyLight = new THREE.DirectionalLight('#fff1e4', 2.8); keyLight.position.set(-3.5, 6.5, 5); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.camera.left = -5; keyLight.shadow.camera.right = 5; keyLight.shadow.camera.top = 5; keyLight.shadow.camera.bottom = -3; keyLight.shadow.normalBias = .035; keyLight.shadow.bias = -.0002; scene.add(keyLight);
  const fill = new THREE.DirectionalLight('#b8c8ff', .95); fill.position.set(5, 3, 2); scene.add(fill);
  const rim = new THREE.PointLight('#efa7d2', 22, 13, 2); rim.position.set(-4, 3.8, -1); scene.add(rim);
  const screenLight = new THREE.PointLight('#ffb5d3', 2.5, 5); screenLight.position.set(-1.2, .9, 2.2); scene.add(screenLight);
  // A small studio environment supplies soft highlights to glass and plastic.
  const room = new THREE.Scene(); room.background = new THREE.Color('#383544');
  for (const [position, scale, tint] of [[[0, 4, 1], [6, 2, 2], '#ede4e6'], [[-4, 1, 0], [1, 5, 4], '#b4a7bc'], [[4, 2, -2], [1, 4, 4], '#9da9c4']]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...scale), new THREE.MeshBasicMaterial({ color: tint })); m.position.fromArray(position); room.add(m);
  }
  const cubeTarget = new THREE.WebGLCubeRenderTarget(64, { type: THREE.HalfFloatType });
  const cubeCamera = new THREE.CubeCamera(.1, 20, cubeTarget); cubeCamera.update(renderer, room);
  const pmrem = new THREE.PMREMGenerator(renderer), environment = pmrem.fromCubemap(cubeTarget.texture); scene.environment = environment.texture;
  cubeTarget.dispose(); pmrem.dispose(); room.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;

  function drawScreen(item, time, final = false) {
    const { ctx, canvas, key, tint } = item, w = canvas.width, h = canvas.height;
    const isMain = ['email', 'qq', 'github'].includes(key);
    const litAt = key === 'github' ? 2.95 : key === 'qq' ? 3.23 : 3.5;
    item.lit = final || time >= litAt || key === 'email' || !isMain;
    ctx.fillStyle = item.lit ? tint : '#161d27'; ctx.fillRect(0, 0, w, h);
    if (!isMain) {
      ctx.fillStyle = '#18262a'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = tint; ctx.lineWidth = 4;
      ctx.beginPath(); for (let x = 0; x < w; x += 4) { const y = h / 2 + Math.sin(x * .035 + time * 3) * 70 * Math.sin(x * .009); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
      ctx.fillStyle = tint; ctx.font = '34px monospace'; ctx.fillText(key === 'aux-a' ? 'PVT.  001' : 'STEREO / FM', 35, 64);
    } else if (key === 'email' && time < 3.5 && !final) {
      ctx.fillStyle = '#24232f'; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(w / 2, h / 2 + 12); ctx.rotate(time * (1.2 + time * 1.6));
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = i === 1 ? tint : '#9aa5b7'; ctx.lineWidth = i === 1 ? 29 : 7; ctx.beginPath(); ctx.arc(0, 0, 120 + i * 34, i * 1.3, i * 1.3 + Math.PI * 1.6); ctx.stroke(); }
      ctx.restore(); ctx.fillStyle = '#f1e6ee'; ctx.font = 'bold 58px monospace'; ctx.textAlign = 'center'; ctx.fillText('TZ', w / 2, h / 2 + 32);
      ctx.font = '24px monospace'; ctx.fillStyle = '#bfc4d3'; ctx.fillText('PRIVATE FREQUENCY', w / 2, 57);
      ctx.fillStyle = tint; ctx.fillRect(74, h - 57, 492 * Math.min(1, time / 3.5), 4);
    } else if (item.lit) {
      ctx.fillStyle = '#242431'; ctx.font = 'bold 29px monospace'; ctx.textAlign = 'left'; ctx.fillText(key === 'email' ? '01 / MAIL' : key === 'qq' ? '02 / SCAN' : '03 / TERMINAL', 43, 53);
      ctx.lineWidth = 10; ctx.strokeStyle = '#292837'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (key === 'email') {
        ctx.strokeRect(173, 134, 294, 196); ctx.beginPath(); ctx.moveTo(173, 134); ctx.lineTo(320, 250); ctx.lineTo(467, 134); ctx.moveTo(173, 330); ctx.lineTo(265, 233); ctx.moveTo(467, 330); ctx.lineTo(375, 233); ctx.stroke();
      } else if (key === 'qq') {
        for (const [x, y, sx, sy] of [[206, 132, 1, 1], [434, 132, -1, 1], [206, 332, 1, -1], [434, 332, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x + sx * 52, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * 52); ctx.stroke(); }
        ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(193, 232); ctx.lineTo(447, 232); ctx.stroke();
        ctx.font = 'bold 39px Arial'; ctx.textAlign = 'center'; ctx.fillText('QQ  /  WeChat', 320, 410);
      } else {
        ctx.font = 'bold 186px monospace'; ctx.textAlign = 'center'; ctx.fillText('>_', 320, 300);
      }
      if (key !== 'qq') { ctx.font = 'bold 33px Arial'; ctx.textAlign = 'center'; ctx.fillText(key === 'email' ? 'Write something good.' : 'Ideas start here.', 320, 410); }
    } else {
      ctx.strokeStyle = '#526170'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(60, 240); ctx.lineTo(580, 240); ctx.stroke();
    }
    const glow = ctx.createRadialGradient(w * .3, h * .2, 0, w / 2, h / 2, w * .65); glow.addColorStop(0, '#ffffff20'); glow.addColorStop(1, '#00000020'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0a102219'; for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
    item.texture = item.material.map; item.texture.needsUpdate = true;
  }
  function resize() {
    const bounds = mount.getBoundingClientRect(), width = Math.max(1, bounds.width), height = Math.max(1, bounds.height);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const distance = Math.max(7.4, 6.1 / (2 * Math.tan(THREE.MathUtils.degToRad(35 / 2)) * camera.aspect));
    end.set(distance * .22, 1.65 + distance * .13, distance);
    if (!running) { camera.position.copy(end); camera.lookAt(centerTarget); renderer.render(scene, camera); }
  }
  const observer = new ResizeObserver(resize); observer.observe(mount); resize();
  function pose(time) {
    const startPosition = new THREE.Vector3(-1.6, 1.02, 3.72), sidePosition = new THREE.Vector3(-3.65, 1.42, 2.63);
    const target = heroTarget.clone();
    if (time < 1.05) {
      camera.position.copy(startPosition).lerp(new THREE.Vector3(-1.13, 1.07, 3.45), smooth(time / 1.05));
      mount.dataset.shot = 'close';
    } else if (time < 2.25) {
      const u = smooth((time - 1.05) / 1.2);
      camera.position.copy(new THREE.Vector3(-1.13, 1.07, 3.45)).lerp(sidePosition, u);
      target.lerp(new THREE.Vector3(-1.34, .96, .42), u * .65); mount.dataset.shot = time < 1.65 ? 'turn' : 'side';
    } else {
      const u = smooth((time - 2.25) / 1.95);
      const path = new THREE.CatmullRomCurve3([sidePosition, new THREE.Vector3(-3.05, 2.1, 4.8), new THREE.Vector3(-.9, 2.9, Math.min(end.z, 7.1)), end]);
      camera.position.copy(path.getPoint(u)); target.copy(new THREE.Vector3(-1.34, .96, .42)).lerp(centerTarget, smooth(u)); mount.dataset.shot = u >= 1 ? 'wide' : 'reveal';
    }
    camera.lookAt(target);
    const textureTick = Math.floor(time * 24);
    if (textureTick !== lastTexture || time >= DURATION) { screens.forEach(item => drawScreen(item, time, time >= DURATION)); lastTexture = textureTick; }
  }
  function render(now) {
    if (!running) return;
    elapsed = Math.min(DURATION, (now - start) / 1000); pose(elapsed); renderer.render(scene, camera);
    if (elapsed >= DURATION) { running = false; ready = true; mount.dataset.playback = 'complete'; onComplete(); return; }
    frame = requestAnimationFrame(render);
  }
  function finish() {
    cancelAnimationFrame(frame); running = false; ready = true; elapsed = DURATION; pose(DURATION); renderer.render(scene, camera); mount.dataset.playback = 'complete'; onComplete();
  }
  function stationAt(event) {
    const bounds = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera); return raycaster.intersectObjects(pickable, false)[0]?.object.userData.station || null;
  }
  function highlight(item) {
    if (item === hover) return;
    if (hover) hover.material.color.setScalar(1);
    hover = item; if (hover) hover.material.color.setScalar(1.18);
    mount.style.cursor = hover ? 'pointer' : 'default'; mount.dataset.hover = hover?.key || ''; renderer.render(scene, camera);
  }
  renderer.domElement.addEventListener('pointermove', event => { if (ready) highlight(stationAt(event)); });
  renderer.domElement.addEventListener('pointerleave', () => { if (ready) highlight(null); });
  renderer.domElement.addEventListener('click', event => { if (ready) { const item = stationAt(event); if (item) onSelect(item.key); } });
  return {
    play({ quiet = false } = {}) {
      cancelAnimationFrame(frame); ready = false; running = true; lastTexture = -1; hover = null; mount.dataset.playback = 'playing'; resize();
      if (quiet) { finish(); return; }
      start = performance.now(); pose(0); renderer.render(scene, camera); frame = requestAnimationFrame(render);
    },
    finish,
    stop() { cancelAnimationFrame(frame); running = false; ready = false; mount.dataset.playback = 'stopped'; },
    dispose() { cancelAnimationFrame(frame); observer.disconnect(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); environment.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
