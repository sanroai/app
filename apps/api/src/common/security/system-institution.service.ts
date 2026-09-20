import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const SANRO_AI_INSTITUTION_CODE = 'SANRO-AI';

@Injectable()
export class SystemInstitutionService {
  private cached: { id: string } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async systemInstitution(): Promise<{ id: string; name: string; type: string; status: string; code: string | null }> {
    if (this.cached) return this.cached as never;
    const inst = await this.prisma.institution.findFirst({
      where: { isSystemInstitution: true },
      select: { id: true, name: true, type: true, status: true, code: true },
    });
    if (!inst) {
      throw new NotFoundException('System institution "SANRO AI" has not been provisioned');
    }
    this.cached = { id: inst.id } as never;
    return inst as never;
  }

  async systemInstitutionId(): Promise<string> {
    return (await this.systemInstitution()).id;
  }

  async isSystemInstitution(institutionId: string | null | undefined): Promise<boolean> {
    if (!institutionId) return false;
    if (this.cached) return this.cached.id === institutionId;
    return institutionId === (await this.systemInstitutionId());
  }
}