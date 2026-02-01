/**
 * Project Factory
 * Creates test project data for MeshIt projects table
 */

import { faker } from '@faker-js/faker';

export type TestProject = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  required_skills: string[];
  team_size: number;
  experience_level: 'any' | 'beginner' | 'intermediate' | 'advanced';
  commitment_hours: number;
  timeline_weeks: number;
  status: 'open' | 'closed' | 'filled' | 'expired';
  expiration_date: Date;
};

const projectTitles = [
  'Build E-Commerce Platform',
  'Create Social Media Dashboard',
  'Develop AI Chatbot',
  'Mobile Fitness Tracker',
  'Real-time Collaboration Tool',
  'Portfolio Website Generator',
  'Task Management System',
  'Recipe Sharing Platform'
];

const skillPool = [
  'TypeScript', 'React', 'Node.js', 'Python', 'Go',
  'PostgreSQL', 'MongoDB', 'Docker', 'AWS',
  'Next.js', 'Vue.js', 'GraphQL', 'REST API'
];

export const createProject = (overrides: Partial<TestProject> = {}): TestProject => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now

  return {
    id: faker.string.uuid(),
    creator_id: faker.string.uuid(),
    title: faker.helpers.arrayElement(projectTitles),
    description: faker.lorem.paragraphs(2),
    required_skills: faker.helpers.arrayElements(skillPool, faker.number.int({ min: 3, max: 6 })),
    team_size: faker.number.int({ min: 2, max: 8 }),
    experience_level: faker.helpers.arrayElement(['any', 'beginner', 'intermediate', 'advanced']),
    commitment_hours: faker.number.int({ min: 5, max: 40 }),
    timeline_weeks: faker.number.int({ min: 4, max: 26 }),
    status: 'open',
    expiration_date: expirationDate,
    ...overrides,
  };
};

export const createProjects = (count: number, overrides: Partial<TestProject> = {}): TestProject[] => {
  return Array.from({ length: count }, () => createProject(overrides));
};

/**
 * Create an expired project
 */
export const createExpiredProject = (overrides: Partial<TestProject> = {}): TestProject => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

  return createProject({
    status: 'expired',
    expiration_date: pastDate,
    ...overrides,
  });
};

/**
 * Create a filled project
 */
export const createFilledProject = (overrides: Partial<TestProject> = {}): TestProject => {
  return createProject({
    status: 'filled',
    ...overrides,
  });
};
