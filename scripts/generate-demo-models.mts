import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface Geometry {
  positions: number[];
  indices: number[];
}

interface Mesh {
  name: string;
  parts: Geometry[];
}

const OUT_DIR = join(process.cwd(), 'apps', 'web', 'public', 'models');

function pushVertex(positions: number[], x: number, y: number, z: number): number {
  const index = positions.length / 3;
  positions.push(x, y, z);
  return index;
}

function box(w: number, h: number, d: number, cx = 0, cy = 0, cz = 0): Geometry {
  const hx = w / 2;
  const hy = h / 2;
  const hz = d / 2;
  const positions: number[] = [];
  const indices: number[] = [];
  const faces: Array<[number, number, number][]> = [
    [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]],
    [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]],
    [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]],
    [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]],
    [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]],
    [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]],
  ];
  for (const face of faces) {
    const base = positions.length / 3;
    for (const [x, y, z] of face) positions.push(x + cx, y + cy, z + cz);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { positions, indices };
}

function cylinder(r: number, h: number, segments = 48): Geometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const hy = h / 2;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const x0 = Math.cos(a0) * r;
    const z0 = Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r;
    const z1 = Math.sin(a1) * r;
    const base = positions.length / 3;
    positions.push(x0, -hy, z0, x1, -hy, z1, x1, hy, z1, x0, hy, z0);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    const capTop = positions.length / 3;
    positions.push(0, hy, 0, x0, hy, z0, x1, hy, z1);
    indices.push(capTop, capTop + 1, capTop + 2);
    const capBottom = positions.length / 3;
    positions.push(0, -hy, 0, x1, -hy, z1, x0, -hy, z0);
    indices.push(capBottom, capBottom + 1, capBottom + 2);
  }
  return { positions, indices };
}

function cone(r: number, h: number, segments = 48): Geometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const hy = h / 2;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const x0 = Math.cos(a0) * r;
    const z0 = Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r;
    const z1 = Math.sin(a1) * r;
    const base = positions.length / 3;
    positions.push(0, hy, 0, x0, -hy, z0, x1, -hy, z1);
    indices.push(base, base + 1, base + 2);
    const cap = positions.length / 3;
    positions.push(0, -hy, 0, x1, -hy, z1, x0, -hy, z0);
    indices.push(cap, cap + 1, cap + 2);
  }
  return { positions, indices };
}

function sphere(r: number, segments = 36, rings = 24): Geometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let y = 0; y <= rings; y++) {
    const v = y / rings;
    const phi = v * Math.PI;
    for (let x = 0; x <= segments; x++) {
      const u = x / segments;
      const theta = u * Math.PI * 2;
      positions.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
    }
  }
  const row = segments + 1;
  for (let y = 0; y < rings; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * row + x;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, indices };
}

function torus(R: number, r: number, segments = 48, sides = 16): Geometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const u = (i / segments) * Math.PI * 2;
    for (let j = 0; j <= sides; j++) {
      const v = (j / sides) * Math.PI * 2;
      positions.push(
        (R + r * Math.cos(v)) * Math.cos(u),
        r * Math.sin(v),
        (R + r * Math.cos(v)) * Math.sin(u),
      );
    }
  }
  const row = sides + 1;
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < sides; j++) {
      const a = i * row + j;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return { positions, indices };
}

function transform(g: Geometry, scale: number, offset: [number, number, number]): Geometry {
  return {
    positions: g.positions.map((value, index) => {
      const axis = index % 3;
      return value * scale + offset[axis];
    }),
    indices: [...g.indices],
  };
}

function rotateX(g: Geometry, angle: number): Geometry {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const positions = [...g.positions];
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    const z = positions[i + 2];
    positions[i + 1] = y * cos - z * sin;
    positions[i + 2] = y * sin + z * cos;
  }
  return { positions, indices: [...g.indices] };
}

function triangularPrism(size: number, length: number): Geometry {
  const r = size * 0.6;
  const hz = length / 2;
  const points: Array<[number, number]> = [
    [0, r],
    [-r * 0.866, -r * 0.5],
    [r * 0.866, -r * 0.5],
  ];
  const positions: number[] = [];
  for (const z of [-hz, hz]) for (const [x, y] of points) positions.push(x, y, z);
  const indices = [
    0, 2, 1,
    3, 4, 5,
    0, 1, 4, 0, 4, 3,
    1, 2, 5, 1, 5, 4,
    2, 0, 3, 2, 3, 5,
  ];
  return { positions, indices };
}

function pyramid(size: number, height: number): Geometry {
  const h = size * 0.5;
  const positions = [h, -height / 2, h, -h, -height / 2, h, -h, -height / 2, -h, h, -height / 2, -h, 0, height / 2, 0];
  const indices = [0, 1, 2, 0, 2, 3, 0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0];
  return { positions, indices };
}

function merge(parts: Geometry[]): Geometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const part of parts) {
    const offset = positions.length / 3;
    positions.push(...part.positions);
    indices.push(...part.indices.map((i) => i + offset));
  }
  return { positions, indices };
}

function computeNormals(g: Geometry): number[] {
  const normals = new Array(g.positions.length).fill(0);
  for (let i = 0; i < g.indices.length; i += 3) {
    const [a, b, c] = [g.indices[i], g.indices[i + 1], g.indices[i + 2]];
    const ax = g.positions[a * 3], ay = g.positions[a * 3 + 1], az = g.positions[a * 3 + 2];
    const bx = g.positions[b * 3], by = g.positions[b * 3 + 1], bz = g.positions[b * 3 + 2];
    const cx = g.positions[c * 3], cy = g.positions[c * 3 + 1], cz = g.positions[c * 3 + 2];
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const idx of [a, b, c]) {
      normals[idx * 3] += nx;
      normals[idx * 3 + 1] += ny;
      normals[idx * 3 + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= len;
    normals[i + 1] /= len;
    normals[i + 2] /= len;
  }
  return normals;
}

function buildGlb(mesh: Mesh, color: [number, number, number]): Buffer {
  const geometry = merge(mesh.parts);
  const normals = computeNormals(geometry);
  const positionBuffer = Buffer.from(new Float32Array(geometry.positions).buffer);
  const normalBuffer = Buffer.from(new Float32Array(normals).buffer);
  const indexBuffer = Buffer.from(new Uint32Array(geometry.indices).buffer);
  const bin = Buffer.concat([positionBuffer, normalBuffer, indexBuffer]);

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < geometry.positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], geometry.positions[i + axis]);
      max[axis] = Math.max(max[axis], geometry.positions[i + axis]);
    }
  }

  const json = {
    asset: { version: '2.0', generator: 'Sanro AI demo model generator' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: mesh.name }],
    meshes: [
      {
        name: mesh.name,
        primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }],
      },
    ],
    materials: [
      {
        name: 'SanroDemoMaterial',
        pbrMetallicRoughness: {
          baseColorFactor: [color[0], color[1], color[2], 1],
          metallicFactor: 0.05,
          roughnessFactor: 0.65,
        },
        doubleSided: true,
      },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: geometry.positions.length / 3, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: normals.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5125, count: geometry.indices.length, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: positionBuffer.length, byteLength: normalBuffer.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: positionBuffer.length + normalBuffer.length,
        byteLength: indexBuffer.length,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: bin.length }],
  };

  const jsonChunk = pad(Buffer.from(JSON.stringify(json), 'utf8'), 0x20);
  const binChunk = pad(bin, 0x00);
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

function pad(buffer: Buffer, fill: number): Buffer {
  const remainder = buffer.length % 4;
  if (remainder === 0) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(4 - remainder, fill)]);
}

const MODELS: Array<{ file: string; mesh: Mesh; color: [number, number, number] }> = [
  { file: 'cube.glb', mesh: { name: 'Cube', parts: [box(1, 1, 1)] }, color: [0.49, 0.23, 0.93] },
  { file: 'cuboid.glb', mesh: { name: 'Cuboid', parts: [box(1.4, 0.8, 0.8)] }, color: [0.35, 0.4, 0.95] },
  { file: 'cylinder.glb', mesh: { name: 'Cylinder', parts: [cylinder(0.5, 1.2)] }, color: [0.2, 0.7, 0.85] },
  { file: 'cone.glb', mesh: { name: 'Cone', parts: [cone(0.5, 1.2)] }, color: [0.95, 0.55, 0.2] },
  { file: 'sphere.glb', mesh: { name: 'Sphere', parts: [sphere(0.6)] }, color: [0.25, 0.8, 0.55] },
  {
    file: 'prism.glb',
    mesh: { name: 'TriangularPrism', parts: [triangularPrism(1.2, 1.2)] },
    color: [0.9, 0.3, 0.55],
  },
  {
    file: 'pyramid.glb',
    mesh: { name: 'Pyramid', parts: [pyramid(1.2, 1.1)] },
    color: [0.95, 0.75, 0.2],
  },
  {
    file: 'atom.glb',
    mesh: {
      name: 'Atom',
      parts: [
        sphere(0.26, 24, 16),
        torus(0.78, 0.018),
        rotateX(torus(0.78, 0.018), Math.PI / 3),
        rotateX(torus(0.78, 0.018), -Math.PI / 3),
      ],
    },
    color: [0.45, 0.35, 0.95],
  },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const model of MODELS) {
  const glb = buildGlb(model.mesh, model.color);
  writeFileSync(join(OUT_DIR, model.file), glb);
  writeFileSync(join(OUT_DIR, model.file.replace(/\.glb$/, '.svg')), thumbnail(model.mesh.name, model.color));
  const magicOk = glb.readUInt32LE(0) === 0x46546c67 && glb.readUInt32LE(4) === 2 && glb.readUInt32LE(8) === glb.length;
  console.log(`${model.file.padEnd(14)} ${String(glb.length).padStart(8)} bytes  valid=${magicOk}`);
}

function thumbnail(label: string, color: [number, number, number]): string {
  const hex = (value: number) => Math.round(value * 255).toString(16).padStart(2, '0');
  const fill = `#${hex(color[0])}${hex(color[1])}${hex(color[2])}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#f5f3ff"/>
  <circle cx="256" cy="210" r="120" fill="${fill}" opacity="0.9"/>
  <text x="256" y="420" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="600" fill="#4c1d95" text-anchor="middle">${label}</text>
</svg>
`;
}
