import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { ArModelFormat, ArValidationStatus } from '@prisma/client';
import { ArValidationService, AR_MODEL_MAX_BYTES } from './ar-validation.service';

const service = new ArValidationService();

function glbFromJson(json: unknown): Buffer {
  const jsonText = JSON.stringify(json);
  const jsonBytes = Buffer.from(jsonText, 'utf8');
  const padded = Buffer.alloc(Math.ceil(jsonBytes.length / 4) * 4, 0x20);
  jsonBytes.copy(padded);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + padded.length, 8);

  const chunkHeader = Buffer.alloc(8);
  chunkHeader.writeUInt32LE(padded.length, 0);
  chunkHeader.writeUInt32LE(0x4e4f534a, 4);

  return Buffer.concat([header, chunkHeader, padded]);
}

const validDocument = {
  asset: { version: '2.0' },
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
  accessors: [{ count: 9 }, { count: 9 }],
  materials: [{ pbrMetallicRoughness: {} }],
  buffers: [],
};

describe('ArValidationService — uploads', () => {
  it('rejects unsupported model extensions', () => {
    expect(() => service.sanitizeModelUpload('model.obj')).toThrow(BadRequestException);
  });

  it('accepts glb and generates a safe random filename', () => {
    const result = service.sanitizeModelUpload('..\\..\\etc\\passwd.glb');
    expect(result.format).toBe(ArModelFormat.GLB);
    expect(result.extension).toBe('.glb');
    expect(result.filename.endsWith('.glb')).toBe(true);
    expect(result.filename).not.toContain('..');
    expect(result.filename).not.toContain('/');
  });

  it('rejects unsupported image MIME types', () => {
    expect(() => service.assertImageMime('application/pdf')).toThrow(BadRequestException);
    expect(() => service.assertImageMime('image/png')).not.toThrow();
  });
});

describe('ArValidationService — model validation', () => {
  it('marks a well-formed GLB as VALID and counts polygons', () => {
    const buffer = glbFromJson(validDocument);
    const result = service.validateModel('model.glb', ArModelFormat.GLB, buffer);
    expect(result.status).toBe(ArValidationStatus.VALID);
    expect(result.polygonCount).toBe(3);
    expect(result.errors).toHaveLength(0);
  });

  it('marks an empty file as INVALID', () => {
    const result = service.validateModel('model.glb', ArModelFormat.GLB, Buffer.alloc(0));
    expect(result.status).toBe(ArValidationStatus.INVALID);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('marks a GLB with invalid magic bytes as INVALID', () => {
    const buffer = glbFromJson(validDocument);
    buffer.writeUInt32LE(0x00000000, 0);
    const result = service.validateModel('model.glb', ArModelFormat.GLB, buffer);
    expect(result.status).toBe(ArValidationStatus.INVALID);
    expect(result.errors.join(' ')).toMatch(/magic/i);
  });

  it('rejects a model larger than the cap without parsing it', () => {
    const oversized = Buffer.alloc(AR_MODEL_MAX_BYTES + 1);
    const result = service.validateModel('model.glb', ArModelFormat.GLB, oversized);
    expect(result.status).toBe(ArValidationStatus.INVALID);
    expect(result.errors.join(' ')).toMatch(/maximum size/i);
  });

  it('flags a glTF with external references but still parses it', () => {
    const json = { ...validDocument, buffers: [{ uri: 'shared.bin', byteLength: 10 }] };
    const result = service.validateModel('model.gltf', ArModelFormat.GLTF, Buffer.from(JSON.stringify(json)));
    expect(result.status).toBe(ArValidationStatus.WARNINGS);
    expect(result.warnings.join(' ')).toMatch(/external/i);
  });

  it('never reports an unverified USDZ model as VALID', () => {
    const buffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00]);
    const result = service.validateModel('model.usdz', ArModelFormat.USDZ, buffer);
    expect(result.status).not.toBe(ArValidationStatus.VALID);
    expect(result.warnings.join(' ')).toMatch(/manual review/i);
  });

  it('reports a corrupt glTF document as INVALID', () => {
    const result = service.validateModel('model.gltf', ArModelFormat.GLTF, Buffer.from('{ not json'));
    expect(result.status).toBe(ArValidationStatus.INVALID);
  });
});
