import prisma from '../config/database';
import { CodeSubmissionStatus } from '@prisma/client';

export class CodeSubmissionService {
  async create(data: {
    userId: string;
    sessionId?: string;
    title: string;
    description: string;
    language: string;
    framework?: string;
    codeContent: string;
    errorDescription?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    tags?: string[];
  }) {
    return prisma.codeSubmission.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        title: data.title,
        description: data.description,
        language: data.language,
        framework: data.framework,
        codeContent: data.codeContent,
        errorDescription: data.errorDescription,
        expectedBehavior: data.expectedBehavior,
        actualBehavior: data.actualBehavior,
        tags: data.tags ?? [],
        attachments: [],
      },
    });
  }

  async getByUser(userId: string) {
    return prisma.codeSubmission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAll(language?: string, status?: CodeSubmissionStatus) {
    return prisma.codeSubmission.findMany({
      where: {
        ...(language && { language }),
        ...(status && { status }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    const submission = await prisma.codeSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
    });
    if (!submission) throw new Error('Submission not found');
    await prisma.codeSubmission.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return submission;
  }

  async updateStatus(id: string, userId: string, status: CodeSubmissionStatus) {
    const submission = await prisma.codeSubmission.findUnique({ where: { id } });
    if (!submission) throw new Error('Submission not found');
    if (submission.userId !== userId) throw new Error('Unauthorized');
    return prisma.codeSubmission.update({ where: { id }, data: { status } });
  }

  async delete(id: string, userId: string) {
    const submission = await prisma.codeSubmission.findUnique({ where: { id } });
    if (!submission) throw new Error('Submission not found');
    if (submission.userId !== userId) throw new Error('Unauthorized');
    return prisma.codeSubmission.delete({ where: { id } });
  }
}

export default new CodeSubmissionService();
