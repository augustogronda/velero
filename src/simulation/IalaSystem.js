import * as THREE from 'three';

export class IalaSystem {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.buoys = [];
    this.active = false;
    this.group.visible = false;

    this.initBuoyMaterials();
    this.buildChannel();
  }

  initBuoyMaterials() {
    this.matGreen = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });
    this.matRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
    this.matBlack = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    this.matWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    this.matYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  }

  buildChannel() {
    // 1. BOYAS LATERALES IALA B (Canal navegable hacia puerto)
    // Estribor: Cono Verde, luz verde impar
    this.createLateralBuoy(new THREE.Vector3(8, 0, -10), 'green', 'Boya Lateral Estribor (Par N°3)', 'Debe dejarse por la banda de estribor al ingresar a puerto. Forma cónica, color verde, número impar.');
    this.createLateralBuoy(new THREE.Vector3(8, 0, 15), 'green', 'Boya Lateral Estribor (Par N°1)', 'Entrada al canal por estribor. Destellos verdes simples.');

    // Babor: Cilindro Rojo, luz roja par
    this.createLateralBuoy(new THREE.Vector3(-8, 0, -10), 'red', 'Boya Lateral Babor (Par N°4)', 'Debe dejarse por la banda de babor al ingresar a puerto. Forma cilíndrica / castillete, color rojo, número par.');
    this.createLateralBuoy(new THREE.Vector3(-8, 0, 15), 'red', 'Boya Lateral Babor (Par N°2)', 'Entrada al canal por babor. Destellos rojos simples.');

    // 2. BOYA DE PELIGRO AISLADO (Casco a pique en el Río de la Plata)
    this.createIsolatedDangerBuoy(new THREE.Vector3(18, 0, 5));

    // 3. BOYA DE AGUAS SEGURAS (Recalada)
    this.createSafeWaterBuoy(new THREE.Vector3(0, 0, 32));
  }

  createLateralBuoy(pos, colorType, name, desc) {
    const buoyGroup = new THREE.Group();
    buoyGroup.position.copy(pos);

    const isGreen = colorType === 'green';
    const mat = isGreen ? this.matGreen : this.matRed;
    const lightColor = isGreen ? 0x22c55e : 0xef4444;

    // Flotador base cilíndrico
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 16), mat);
    base.position.y = 0.5;
    buoyGroup.add(base);

    // Marca de tope IALA B:
    // Verde = Cono con vértice arriba
    // Rojo = Cilindro
    let topMark;
    if (isGreen) {
      topMark = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.9, 16), mat);
      topMark.position.y = 1.6;
    } else {
      topMark = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 16), mat);
      topMark.position.y = 1.5;
    }
    buoyGroup.add(topMark);

    // Linterna lumínica en el tope
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: lightColor, emissive: lightColor, emissiveIntensity: 1.5 })
    );
    lantern.position.y = isGreen ? 2.15 : 1.95;
    buoyGroup.add(lantern);

    const light = new THREE.PointLight(lightColor, 2.0, 12);
    light.position.copy(lantern.position);
    buoyGroup.add(light);

    buoyGroup.userData = {
      name,
      desc,
      flashType: isGreen ? 'Fl G 4s' : 'Fl R 4s',
      period: isGreen ? 4.0 : 3.0,
      light,
      lantern
    };

    this.group.add(buoyGroup);
    this.buoys.push(buoyGroup);
  }

  createIsolatedDangerBuoy(pos) {
    const buoyGroup = new THREE.Group();
    buoyGroup.position.copy(pos);

    // Cuerpo con franjas negras y rojas
    const baseBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16), this.matBlack);
    baseBottom.position.y = 0.25;
    buoyGroup.add(baseBottom);

    const baseMid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16), this.matRed);
    baseMid.position.y = 0.7;
    buoyGroup.add(baseMid);

    const baseTop = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16), this.matBlack);
    baseTop.position.y = 1.15;
    buoyGroup.add(baseTop);

    // Marca de tope: DOS ESFERAS NEGRAS superpuestas
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), this.matBlack);
    s1.position.y = 1.7;
    buoyGroup.add(s1);

    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), this.matBlack);
    s2.position.y = 2.25;
    buoyGroup.add(s2);

    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 })
    );
    lantern.position.y = 2.6;
    buoyGroup.add(lantern);

    const light = new THREE.PointLight(0xffffff, 2.5, 15);
    light.position.copy(lantern.position);
    buoyGroup.add(light);

    buoyGroup.userData = {
      name: 'Boya de Peligro Aislado (Casco a Pique)',
      desc: 'Indica un peligro puntual con aguas navegables a su alrededor. Color negro con fajas rojas. Marca de tope: dos esferas negras. Luz blanca grupo de 2 destellos Fl(2) 5s.',
      flashType: 'Fl(2) W 5s',
      period: 5.0,
      light,
      lantern
    };

    this.group.add(buoyGroup);
    this.buoys.push(buoyGroup);
  }

  createSafeWaterBuoy(pos) {
    const buoyGroup = new THREE.Group();
    buoyGroup.position.copy(pos);

    // Esfera o franjas verticales rojas y blancas
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 16), this.matWhite);
    base.position.y = 0.6;
    buoyGroup.add(base);

    // Marca de tope: UNA ESFERA ROJA
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), this.matRed);
    sphere.position.y = 1.8;
    buoyGroup.add(sphere);

    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 })
    );
    lantern.position.y = 2.3;
    buoyGroup.add(lantern);

    const light = new THREE.PointLight(0xffffff, 2.5, 15);
    light.position.copy(lantern.position);
    buoyGroup.add(light);

    buoyGroup.userData = {
      name: 'Boya de Aguas Seguras (Recalada)',
      desc: 'Indica que hay aguas navegables alrededor de la marca. Señala el inicio de un canal de acceso. Franjas rojas y blancas con una esfera roja.',
      flashType: 'Mo(A) W 6s',
      period: 6.0,
      light,
      lantern
    };

    this.group.add(buoyGroup);
    this.buoys.push(buoyGroup);
  }

  setActive(enabled) {
    this.active = enabled;
    this.group.visible = enabled;
  }

  update(delta, time) {
    if (!this.active || !this.group.visible) return;

    // Animación de destellos lumínicos según su ritmo oficial
    for (const b of this.buoys) {
      const data = b.userData;
      if (!data || !data.light) continue;

      const t = time % data.period;
      // Parpadeo breve (destello de 0.5s)
      const isLit = t < 0.6;
      data.light.intensity = isLit ? 2.8 : 0.1;
      data.lantern.material.emissiveIntensity = isLit ? 2.5 : 0.1;

      // Balanceo suave en el agua
      b.rotation.z = Math.sin(time * 1.5 + b.position.x) * 0.06;
      b.rotation.x = Math.cos(time * 1.3 + b.position.z) * 0.05;
    }
  }
}
