import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  async createContactLead(data: {
    name: string;
    email: string;
    role: string;
    message: string;
    source?: string;
  }) {
    return this.prisma.contactLead.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        message: data.message,
        source: data.source ?? 'website',
      },
    });
  }

  async listContactLeads(limit = 100) {
    return this.prisma.contactLead.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}