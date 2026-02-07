/**
 * Project Factory
 * Creates test project data for MeshIt postings table
 */

import { faker } from "@faker-js/faker";

export type TestProject = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  skills: string[];
  team_size_min: number;
  team_size_max: number;
  category: string;
  tags: string[];
  mode: "remote" | "hybrid" | "onsite";
  location_preference: string | null;
  estimated_time: string;
  skill_level_min: number;
  context_identifier: string | null;
  natural_language_criteria: string | null;
  status: "open" | "closed" | "filled" | "expired";
  expiration_date: Date;
};

const projectTitles = [
  "Build E-Commerce Platform",
  "Create Social Media Dashboard",
  "Develop AI Chatbot",
  "Mobile Fitness Tracker",
  "Real-time Collaboration Tool",
  "Portfolio Website Generator",
  "Task Management System",
  "Recipe Sharing Platform",
];

const skillPool = [
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Go",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "AWS",
  "Next.js",
  "Vue.js",
  "GraphQL",
  "REST API",
];

const categoryPool = [
  "side-project",
  "startup",
  "open-source",
  "freelance",
  "hackathon",
];

const tagPool = [
  "web",
  "mobile",
  "ai",
  "devops",
  "design",
  "backend",
  "frontend",
  "fullstack",
];

export const createProject = (
  overrides: Partial<TestProject> = {},
): TestProject => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from now

  const teamSizeMin = faker.number.int({ min: 2, max: 4 });

  return {
    id: faker.string.uuid(),
    creator_id: faker.string.uuid(),
    title: faker.helpers.arrayElement(projectTitles),
    description: faker.lorem.paragraphs(2),
    skills: faker.helpers.arrayElements(
      skillPool,
      faker.number.int({ min: 3, max: 6 }),
    ),
    team_size_min: teamSizeMin,
    team_size_max: teamSizeMin + faker.number.int({ min: 1, max: 4 }),
    category: faker.helpers.arrayElement(categoryPool),
    tags: faker.helpers.arrayElements(
      tagPool,
      faker.number.int({ min: 1, max: 4 }),
    ),
    mode: faker.helpers.arrayElement(["remote", "hybrid", "onsite"]),
    location_preference:
      faker.helpers.maybe(() => faker.location.city(), { probability: 0.4 }) ??
      null,
    estimated_time: `${faker.number.int({ min: 1, max: 12 })} months`,
    skill_level_min: faker.number.int({ min: 1, max: 5 }),
    context_identifier: null,
    natural_language_criteria: null,
    status: "open",
    expiration_date: expirationDate,
    ...overrides,
  };
};

export const createProjects = (
  count: number,
  overrides: Partial<TestProject> = {},
): TestProject[] => {
  return Array.from({ length: count }, () => createProject(overrides));
};

/**
 * Create an expired project
 */
export const createExpiredProject = (
  overrides: Partial<TestProject> = {},
): TestProject => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

  return createProject({
    status: "expired",
    expiration_date: pastDate,
    ...overrides,
  });
};

/**
 * Create a filled project
 */
export const createFilledProject = (
  overrides: Partial<TestProject> = {},
): TestProject => {
  return createProject({
    status: "filled",
    ...overrides,
  });
};
