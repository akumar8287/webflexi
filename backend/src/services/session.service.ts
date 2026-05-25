import prisma from '../config/database';
import { SessionStatus } from '@prisma/client';

export class SessionService {
  // Get all sessions for a user
  async getUserSessions(userId: string) {
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { juniorId: userId },
          { seniorId: userId },
        ],
      },
      include: {
        junior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        review: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions;
  }

  // Get session statistics for a user
  async getUserStats(userId: string, role: string) {
    const whereClause = role === 'JUNIOR'
      ? { juniorId: userId }
      : { seniorId: userId };

    const [pending, active, completed, total] = await Promise.all([
      prisma.session.count({
        where: { ...whereClause, status: SessionStatus.PENDING },
      }),
      prisma.session.count({
        where: { ...whereClause, status: SessionStatus.ACTIVE },
      }),
      prisma.session.count({
        where: { ...whereClause, status: SessionStatus.COMPLETED },
      }),
      prisma.session.count({
        where: whereClause,
      }),
    ]);

    return { pending, active, completed, total };
  }

  // Get all mentors (senior users)
  async getMentors(search?: string) {
    const mentors = await prisma.user.findMany({
      where: {
        role: 'SENIOR',
        isActive: true,
        ...(search && {
          OR: [
            { skills: { has: search } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        bio: true,
        skills: true,
        experienceYears: true,
        hourlyRate: true,
        profilePicture: true,
        receivedReviews: {
          select: {
            rating: true,
          },
        },
        receivedSessions: {
          where: { status: SessionStatus.COMPLETED },
          select: { id: true },
        },
      },
      take: 20,
    });

    // Calculate average rating for each mentor
    return mentors.map((mentor) => {
      const totalRating = mentor.receivedReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating =
        mentor.receivedReviews.length > 0
          ? totalRating / mentor.receivedReviews.length
          : 0;

      return {
        id: mentor.id,
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        bio: mentor.bio,
        skills: mentor.skills,
        experienceYears: mentor.experienceYears,
        hourlyRate: mentor.hourlyRate,
        profilePicture: mentor.profilePicture,
        rating: avgRating,
        completedSessions: mentor.receivedSessions.length,
      };
    });
  }

  // Create a new session
  async createSession(data: {
    juniorId: string;
    seniorId: string;
    scheduledAt?: Date;
    price?: number;
  }) {
    const session = await prisma.session.create({
      data: {
        juniorId: data.juniorId,
        seniorId: data.seniorId,
        scheduledAt: data.scheduledAt,
        price: data.price,
        status: SessionStatus.PENDING,
      },
      include: {
        junior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return session;
  }

  // Get session by ID
  async getSessionById(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        junior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  }

  // Update session status
  async updateSessionStatus(sessionId: string, status: SessionStatus) {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { status },
    });

    return session;
  }

  // Accept session request (for mentors)
  async acceptSession(sessionId: string, mentorId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.seniorId !== mentorId) {
      throw new Error('Unauthorized to accept this session');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.SCHEDULED,
        scheduledAt: session.scheduledAt || new Date(),
      },
      include: {
        junior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedSession;
  }

  // Reject session request (for mentors)
  async rejectSession(sessionId: string, mentorId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.seniorId !== mentorId) {
      throw new Error('Unauthorized to reject this session');
    }

    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.CANCELLED },
      include: {
        junior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        senior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedSession;
  }

  // Get pending requests for a mentor
  async getMentorRequests(mentorId: string) {
    const requests = await prisma.session.findMany({
      where: {
        seniorId: mentorId,
        status: SessionStatus.PENDING,
      },
      include: {
        junior: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            skills: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  // Start a session (set ACTIVE + startedAt)
  async startSession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');
    if (session.juniorId !== userId && session.seniorId !== userId) {
      throw new Error('Unauthorized');
    }
    return prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.ACTIVE, startedAt: new Date() },
    });
  }

  // End a session (set COMPLETED + endedAt + duration)
  async endSession(sessionId: string, userId: string) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new Error('Session not found');
    if (session.juniorId !== userId && session.seniorId !== userId) {
      throw new Error('Unauthorized');
    }
    const endedAt = new Date();
    const duration = session.startedAt
      ? Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000)
      : null;
    return prisma.session.update({
      where: { id: sessionId },
      data: { status: SessionStatus.COMPLETED, endedAt, duration },
    });
  }

  // Get earnings for a mentor
  async getMentorEarnings(mentorId: string) {
    const sessions = await prisma.session.findMany({
      where: {
        seniorId: mentorId,
        status: SessionStatus.COMPLETED,
      },
      select: {
        price: true,
        mentorPayout: true,
        createdAt: true,
      },
    });

    const totalEarnings = sessions.reduce(
      (sum, session) => sum + (session.mentorPayout || 0),
      0
    );

    const thisMonthEarnings = sessions
      .filter((session) => {
        const sessionDate = new Date(session.createdAt);
        const now = new Date();
        return (
          sessionDate.getMonth() === now.getMonth() &&
          sessionDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, session) => sum + (session.mentorPayout || 0), 0);

    return {
      total: totalEarnings,
      thisMonth: thisMonthEarnings,
      sessions: sessions.length,
    };
  }
}

export default new SessionService();
