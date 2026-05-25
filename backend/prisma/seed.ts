import { PrismaClient, UserRole, SessionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.codeSubmission.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  // --- Senior Mentors ---
  const alice = await prisma.user.create({
    data: {
      email: 'alice@webflexi.dev',
      password,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: UserRole.SENIOR,
      bio: 'Full-stack engineer with 8 years of experience. Specialised in React, Node.js, and distributed systems. Love helping developers level up.',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
      experienceYears: 8,
      hourlyRate: 75,
      timezone: 'America/New_York',
      githubUrl: 'https://github.com/alice-dev',
      isVerified: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@webflexi.dev',
      password,
      firstName: 'Bob',
      lastName: 'Smith',
      role: UserRole.SENIOR,
      bio: 'Python and ML engineer. 6 years building data pipelines and AI products. Passionate about clean code and mentorship.',
      skills: ['Python', 'Django', 'FastAPI', 'TensorFlow', 'PostgreSQL', 'Redis'],
      experienceYears: 6,
      hourlyRate: 60,
      timezone: 'Europe/London',
      githubUrl: 'https://github.com/bob-ml',
      isVerified: true,
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@webflexi.dev',
      password,
      firstName: 'Carol',
      lastName: 'Chen',
      role: UserRole.SENIOR,
      bio: 'Mobile and frontend specialist. 5 years with React Native and Flutter. Previously at Google.',
      skills: ['React Native', 'Flutter', 'JavaScript', 'TypeScript', 'GraphQL', 'Firebase'],
      experienceYears: 5,
      hourlyRate: 65,
      timezone: 'America/Los_Angeles',
      isVerified: true,
    },
  });

  const dave = await prisma.user.create({
    data: {
      email: 'dave@webflexi.dev',
      password,
      firstName: 'Dave',
      lastName: 'Kumar',
      role: UserRole.SENIOR,
      bio: 'DevOps and backend engineer. Kubernetes, CI/CD, microservices. 7 years at various startups and FAANG.',
      skills: ['Go', 'Kubernetes', 'Docker', 'AWS', 'Terraform', 'gRPC', 'PostgreSQL'],
      experienceYears: 7,
      hourlyRate: 80,
      timezone: 'Asia/Kolkata',
      isVerified: true,
    },
  });

  // --- Junior Developers ---
  const junior1 = await prisma.user.create({
    data: {
      email: 'jay@webflexi.dev',
      password,
      firstName: 'Jay',
      lastName: 'Patel',
      role: UserRole.JUNIOR,
      bio: 'CS graduate, 6 months into my first dev job. Learning React and trying to level up fast.',
      skills: ['JavaScript', 'React', 'HTML', 'CSS'],
      experienceYears: 0,
      timezone: 'Asia/Kolkata',
    },
  });

  const junior2 = await prisma.user.create({
    data: {
      email: 'mia@webflexi.dev',
      password,
      firstName: 'Mia',
      lastName: 'Torres',
      role: UserRole.JUNIOR,
      bio: 'Bootcamp grad. Looking to go deeper into backend and APIs.',
      skills: ['Python', 'JavaScript', 'Flask'],
      experienceYears: 0,
      timezone: 'America/Chicago',
    },
  });

  // --- Admin ---
  await prisma.user.create({
    data: {
      email: 'admin@webflexi.dev',
      password,
      firstName: 'Admin',
      lastName: 'WebFlexi',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  // --- Completed session with review ---
  const completedSession = await prisma.session.create({
    data: {
      juniorId: junior1.id,
      seniorId: alice.id,
      status: SessionStatus.COMPLETED,
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      endedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000),
      duration: 60,
      sessionNotes: 'Fixed useEffect dependency array issue causing infinite re-renders. Explained React rendering model.',
    },
  });

  await prisma.review.create({
    data: {
      sessionId: completedSession.id,
      reviewerId: junior1.id,
      revieweeId: alice.id,
      rating: 5,
      comment: 'Alice was incredibly patient and explained concepts clearly. Fixed my issue in 10 minutes then taught me why it happened!',
    },
  });

  // Second review for alice
  const completedSession2 = await prisma.session.create({
    data: {
      juniorId: junior2.id,
      seniorId: alice.id,
      status: SessionStatus.COMPLETED,
      scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      duration: 45,
    },
  });

  await prisma.review.create({
    data: {
      sessionId: completedSession2.id,
      reviewerId: junior2.id,
      revieweeId: alice.id,
      rating: 5,
      comment: 'Super knowledgeable. Helped me understand async/await properly.',
    },
  });

  // Review for bob
  const completedSession3 = await prisma.session.create({
    data: {
      juniorId: junior1.id,
      seniorId: bob.id,
      status: SessionStatus.COMPLETED,
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 50 * 60 * 1000),
      duration: 50,
    },
  });

  await prisma.review.create({
    data: {
      sessionId: completedSession3.id,
      reviewerId: junior1.id,
      revieweeId: bob.id,
      rating: 4,
      comment: 'Very helpful with Python debugging. Would definitely book again.',
    },
  });

  // --- Pending session request ---
  await prisma.session.create({
    data: {
      juniorId: junior1.id,
      seniorId: carol.id,
      status: SessionStatus.PENDING,
    },
  });

  // --- Code submission ---
  await prisma.codeSubmission.create({
    data: {
      userId: junior1.id,
      title: 'useEffect causing infinite re-render',
      description: 'My component keeps re-rendering infinitely when I fetch data inside useEffect.',
      language: 'javascript',
      framework: 'React',
      codeContent: `import { useState, useEffect } from 'react';\n\nfunction UserList() {\n  const [users, setUsers] = useState([]);\n\n  useEffect(() => {\n    fetch('/api/users')\n      .then(r => r.json())\n      .then(data => setUsers(data)); // This causes infinite loop!\n  }, [users]); // BUG: users in dependency array\n\n  return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;\n}`,
      errorDescription: 'Component re-renders infinitely. Browser tab crashes after ~30 seconds.',
      expectedBehavior: 'Fetch users once on mount and display them.',
      actualBehavior: 'Fetches on every render, causing infinite loop.',
      tags: ['react', 'hooks', 'useEffect', 'bug'],
      status: 'RESOLVED',
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Test accounts (password: password123):');
  console.log('  Junior:  jay@webflexi.dev');
  console.log('  Junior:  mia@webflexi.dev');
  console.log('  Senior:  alice@webflexi.dev');
  console.log('  Senior:  bob@webflexi.dev');
  console.log('  Senior:  carol@webflexi.dev');
  console.log('  Senior:  dave@webflexi.dev');
  console.log('  Admin:   admin@webflexi.dev');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
