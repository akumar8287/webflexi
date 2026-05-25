import prisma from '../config/database';

export class ReviewService {
  async create(data: {
    sessionId: string;
    reviewerId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  }) {
    const session = await prisma.session.findUnique({ where: { id: data.sessionId } });
    if (!session) throw new Error('Session not found');
    if (session.status !== 'COMPLETED') throw new Error('Session not completed');
    if (session.juniorId !== data.reviewerId) throw new Error('Only the junior can leave a review');

    const existing = await prisma.review.findUnique({ where: { sessionId: data.sessionId } });
    if (existing) throw new Error('Review already exists for this session');

    return prisma.review.create({
      data: {
        sessionId: data.sessionId,
        reviewerId: data.reviewerId,
        revieweeId: data.revieweeId,
        rating: data.rating,
        comment: data.comment,
      },
    });
  }

  async getMentorReviews(mentorId: string) {
    const reviews = await prisma.review.findMany({
      where: { revieweeId: mentorId },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return { reviews, averageRating: Math.round(avg * 10) / 10, total: reviews.length };
  }

  async getSessionReview(sessionId: string) {
    return prisma.review.findUnique({
      where: { sessionId },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }
}

export default new ReviewService();
