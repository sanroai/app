import { BadRequestException, Injectable } from '@nestjs/common';
import { ArModelFormat, ArValidationStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { basename, extname } from 'node:path';

export const AR_MODEL_MAX_BYTES = 50 * 1024 * 1024;
export const AR_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const MODEL_EXTENSIONS: Record<string, ArModelFormat> = {
  '.glb': ArModelFormat.GLB,
  '.gltf': ArModelFormat.GLTF,
  '.usdz': ArModelFormat.USDZ,
};

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'];

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface ValidationResult {
  status: ArValidationStatus;
  checks: ValidationCheck[];
  warnings: string[];
  errors: string[];
  polygonCount?: number;
  textureMaxDim?: number;
}

export interface SanitizedUpload {
  filename: string;
  extension: string;
  format: ArModelFormat;
}

@Injectable()
export class ArValidationService {
  sanitizeModelUpload(originalName: string): SanitizedUpload {
    const safe = this.safeName(originalName);
    const extension = extname(safe).toLowerCase();
    const format = MODEL_EXTENSIONS[extension];
    if (!format) {
      throw new BadRequestException(
        `Unsupported model format "${extension || 'unknown'}". Allowed: .glb, .gltf, .usdz`,
      );
    }
    return { filename: `${randomUUID()}${extension}`, extension, format };
  }

  sanitizeImageUpload(originalName: string): { filename: string; extension: string } {
    const safe = this.safeName(originalName);
    const extension = extname(safe).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `Unsupported image format "${extension || 'unknown'}". Allowed: png, jpg, jpeg, webp`,
      );
    }
    return { filename: `${randomUUID()}${extension}`, extension };
  }

  assertImageMime(mimetype: string): void {
    if (mimetype && !IMAGE_MIME.includes(mimetype)) {
      throw new BadRequestException(`Unsupported image MIME type "${mimetype}"`);
    }
  }

  validateModel(filename: string, format: ArModelFormat, buffer: Buffer): ValidationResult {
    const checks: ValidationCheck[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    let polygonCount: number | undefined;

    checks.push({
      name: 'readable',
      passed: buffer && buffer.length > 0,
      detail: buffer ? `${buffer.length} bytes` : 'empty file',
    });
    if (!buffer || buffer.length === 0) {
      errors.push('Model file is empty');
      return this.finalize(checks, warnings, errors, polygonCount);
    }

    if (buffer.length > AR_MODEL_MAX_BYTES) {
      errors.push(`Model exceeds maximum size of ${Math.round(AR_MODEL_MAX_BYTES / (1024 * 1024))}MB`);
      checks.push({ name: 'size', passed: false, detail: `${buffer.length} bytes` });
      return this.finalize(checks, warnings, errors, polygonCount);
    }
    checks.push({ name: 'size', passed: true });

    try {
      if (format === ArModelFormat.GLB) {
        const glb = this.inspectGlb(buffer, checks, warnings, errors);
        polygonCount = glb.polygonCount;
      } else if (format === ArModelFormat.GLTF) {
        const gltf = this.inspectGltf(buffer, checks, warnings, errors);
        polygonCount = gltf.polygonCount;
      } else if (format === ArModelFormat.USDZ) {
        const magic = buffer.subarray(0, 4).toString('ascii');
        const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
        const isUsdc = magic.startsWith('PXR');
        checks.push({
          name: 'container',
          passed: isZip || isUsdc,
          detail: isZip ? 'zip/usdz container' : isUsdc ? 'usdc' : 'unrecognised header',
        });
        if (!isZip && !isUsdc) {
          errors.push('File does not look like a valid USDZ container');
        }
        warnings.push('USDZ deep validation is not performed server-side — manual review required');
      }
    } catch (err) {
      errors.push(`Failed to parse model: ${(err as Error).message}`);
      checks.push({ name: 'parse', passed: false, detail: (err as Error).message });
    }

    return this.finalize(checks, warnings, errors, polygonCount);
  }

  private inspectGlb(
    buffer: Buffer,
    checks: ValidationCheck[],
    warnings: string[],
    errors: string[],
  ): { polygonCount?: number } {
    if (buffer.length < 12) {
      errors.push('GLB header is truncated');
      checks.push({ name: 'glb-header', passed: false });
      return {};
    }
    const magic = buffer.readUInt32LE(0);
    const version = buffer.readUInt32LE(4);
    const declaredLength = buffer.readUInt32LE(8);
    const magicOk = magic === 0x46546c67;
    checks.push({ name: 'glb-magic', passed: magicOk, detail: magicOk ? 'glTF' : 'invalid magic' });
    checks.push({ name: 'glb-version', passed: version === 2, detail: `v${version}` });
    checks.push({
      name: 'glb-length',
      passed: declaredLength === buffer.length,
      detail: `declared ${declaredLength} / actual ${buffer.length}`,
    });
    if (!magicOk) {
      errors.push('Invalid GLB magic bytes');
      return {};
    }
    if (version !== 2) errors.push(`Unsupported GLB version ${version}`);
    if (declaredLength !== buffer.length) {
      warnings.push('GLB declared length does not match file size — file may be truncated');
    }

    let offset = 12;
    let json: any = null;
    while (offset + 8 <= buffer.length) {
      const chunkLength = buffer.readUInt32LE(offset);
      const chunkType = buffer.readUInt32LE(offset + 4);
      const dataStart = offset + 8;
      const dataEnd = dataStart + chunkLength;
      if (dataEnd > buffer.length) {
        warnings.push('GLB contains a chunk that overruns the file');
        break;
      }
      if (chunkType === 0x4e4f534a) {
        json = JSON.parse(buffer.subarray(dataStart, dataEnd).toString('utf8').replace(/\u0000+$/g, '').trim());
      }
      offset = dataEnd;
    }
    if (!json) {
      errors.push('GLB has no readable JSON chunk');
      checks.push({ name: 'glb-json', passed: false });
      return {};
    }
    checks.push({ name: 'glb-json', passed: true });
    return this.inspectGltfDocument(json, checks, warnings, errors, true);
  }

  private inspectGltf(
    buffer: Buffer,
    checks: ValidationCheck[],
    warnings: string[],
    errors: string[],
  ): { polygonCount?: number } {
    let json: any;
    try {
      json = JSON.parse(buffer.toString('utf8'));
    } catch (err) {
      errors.push(`Invalid glTF JSON: ${(err as Error).message}`);
      checks.push({ name: 'gltf-json', passed: false });
      return {};
    }
    checks.push({ name: 'gltf-json', passed: true });
    return this.inspectGltfDocument(json, checks, warnings, errors, false);
  }

  private inspectGltfDocument(
    json: any,
    checks: ValidationCheck[],
    warnings: string[],
    errors: string[],
    embedded: boolean,
  ): { polygonCount?: number } {
    const assetVersion = json?.asset?.version;
    const versionOk = typeof assetVersion === 'string' && assetVersion.startsWith('2');
    checks.push({ name: 'asset-version', passed: versionOk, detail: assetVersion ?? 'missing' });
    if (!versionOk) warnings.push('glTF asset version missing or unsupported (expected 2.x)');

    const meshes = Array.isArray(json?.meshes) ? json.meshes : [];
    checks.push({ name: 'meshes', passed: meshes.length > 0, detail: `${meshes.length} mesh(es)` });
    if (meshes.length === 0) errors.push('Model contains no meshes');

    let polygonCount = 0;
    for (const mesh of meshes) {
      for (const primitive of mesh.primitives ?? []) {
        const accessorIndex = primitive?.indices;
        if (typeof accessorIndex === 'number' && json.accessors?.[accessorIndex]?.count) {
          polygonCount += Math.floor(json.accessors[accessorIndex].count / 3);
        } else if (typeof primitive?.attributes?.POSITION === 'number') {
          const count = json.accessors?.[primitive.attributes.POSITION]?.count;
          if (count) polygonCount += Math.floor(count / 3);
        }
      }
    }
    checks.push({ name: 'polygons', passed: true, detail: `${polygonCount} triangles` });
    if (polygonCount > 500000) {
      warnings.push(`High polygon count (${polygonCount}) — may be slow on low-end devices`);
    }

    const externalUris: string[] = [];
    for (const source of [...(json.buffers ?? []), ...(json.images ?? [])]) {
      if (source?.uri && !source.uri.startsWith('data:')) externalUris.push(source.uri);
    }
    if (externalUris.length > 0) {
      const detail = `${externalUris.length} external reference(s)`;
      checks.push({ name: 'self-contained', passed: false, detail });
      if (embedded) {
        warnings.push('GLB references external resources — model may render incompletely');
      } else {
        warnings.push(`glTF ${detail} — upload GLB or ensure referenced files are available`);
      }
    } else {
      checks.push({ name: 'self-contained', passed: true });
    }

    const materials = Array.isArray(json?.materials) ? json.materials.length : 0;
    const images = Array.isArray(json?.images) ? json.images.length : 0;
    checks.push({ name: 'materials', passed: true, detail: `${materials} material(s), ${images} texture(s)` });
    if (materials === 0) warnings.push('Model has no materials — it may appear untextured');

    if (json?.animations?.length) {
      checks.push({ name: 'animations', passed: true, detail: `${json.animations.length}` });
    }

    return { polygonCount };
  }

  private finalize(
    checks: ValidationCheck[],
    warnings: string[],
    errors: string[],
    polygonCount?: number,
  ): ValidationResult {
    let status: ArValidationStatus;
    if (errors.length > 0) status = ArValidationStatus.INVALID;
    else if (checks.some((c) => !c.passed) || warnings.length > 0) status = ArValidationStatus.WARNINGS;
    else status = ArValidationStatus.VALID;
    if (status === ArValidationStatus.VALID && polygonCount === undefined) {
      status = ArValidationStatus.INCOMPLETE;
      warnings.push('Validation incomplete — manual review required');
    }
    return { status, checks, warnings, errors, polygonCount };
  }

  private safeName(originalName: string): string {
    const base = basename(originalName || '').replace(/\\/g, '/').split('/').pop() ?? '';
    const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_');
    if (!cleaned || cleaned.startsWith('.')) {
      throw new BadRequestException('Invalid file name');
    }
    return cleaned;
  }
}
