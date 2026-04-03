import { lazy, type ComponentType } from 'react'

export interface DocEntry {
  slug: string
  title: string
  section: 'tutorials' | 'how-to' | 'explanations' | 'references'
  order: number
}

export const docs: DocEntry[] = [
  // Tutorials
  { slug: 'tutorials/getting-started', title: 'Getting Started', section: 'tutorials', order: 0 },
  { slug: 'tutorials/setup-dev-environment', title: 'Setup Development Environment', section: 'tutorials', order: 1 },
  { slug: 'tutorials/running-frontend', title: 'Running the React Frontend', section: 'tutorials', order: 2 },
  { slug: 'tutorials/running-backend', title: 'Running the FastAPI Backend', section: 'tutorials', order: 3 },
  { slug: 'tutorials/running-full-stack', title: 'Running the Full Stack Locally', section: 'tutorials', order: 4 },
  { slug: 'tutorials/database-setup', title: 'Database Setup and Migrations', section: 'tutorials', order: 5 },
  { slug: 'tutorials/docker-setup', title: 'Building and Running with Docker', section: 'tutorials', order: 6 },

  // How-to Guides
  { slug: 'how-to/add-api-endpoint', title: 'Add a New API Endpoint', section: 'how-to', order: 0 },
  { slug: 'how-to/create-react-page', title: 'Create a New React Page', section: 'how-to', order: 1 },
  { slug: 'how-to/add-database-model', title: 'Add a New Database Model', section: 'how-to', order: 2 },
  { slug: 'how-to/add-auth-to-route', title: 'Add Authentication to a Route', section: 'how-to', order: 3 },
  { slug: 'how-to/write-tests', title: 'Write Tests', section: 'how-to', order: 4 },
  { slug: 'how-to/deploy', title: 'Deploy the Application', section: 'how-to', order: 5 },
  { slug: 'how-to/update-env-vars', title: 'Update Environment Variables', section: 'how-to', order: 6 },
  { slug: 'how-to/add-feature-module', title: 'Add a New Feature Module', section: 'how-to', order: 7 },

  // Explanations
  { slug: 'explanations/architecture-overview', title: 'Architecture Overview', section: 'explanations', order: 0 },
  { slug: 'explanations/frontend-architecture', title: 'Frontend Architecture', section: 'explanations', order: 1 },
  { slug: 'explanations/backend-architecture', title: 'Backend Architecture', section: 'explanations', order: 2 },
  { slug: 'explanations/monorepo-structure', title: 'Monorepo Structure', section: 'explanations', order: 3 },
  { slug: 'explanations/authentication-design', title: 'Authentication Design', section: 'explanations', order: 4 },
  { slug: 'explanations/data-model', title: 'Data Model', section: 'explanations', order: 5 },
  { slug: 'explanations/api-design', title: 'API Design Principles', section: 'explanations', order: 6 },
  { slug: 'explanations/deployment-strategy', title: 'Deployment Strategy', section: 'explanations', order: 7 },

  // References
  { slug: 'references/api-reference', title: 'API Endpoints', section: 'references', order: 0 },
  { slug: 'references/database-schema', title: 'Database Schema', section: 'references', order: 1 },
  { slug: 'references/environment-variables', title: 'Environment Variables', section: 'references', order: 2 },
  { slug: 'references/cli-commands', title: 'CLI Commands', section: 'references', order: 3 },
  { slug: 'references/project-structure', title: 'Project Directory Structure', section: 'references', order: 4 },
]

const modules = import.meta.glob('../docs/**/*.mdx') as Record<string, () => Promise<{ default: ComponentType }>>

const componentCache: Record<string, React.LazyExoticComponent<ComponentType>> = {}

export function getDocComponent(slug: string): React.LazyExoticComponent<ComponentType> | null {
  if (componentCache[slug]) return componentCache[slug]
  const path = `../docs/${slug}.mdx`
  const loader = modules[path]
  if (!loader) return null
  const component = lazy(loader)
  componentCache[slug] = component
  return component
}

export const sections = [
  { key: 'tutorials' as const, label: 'Tutorials', description: 'Learn step by step' },
  { key: 'how-to' as const, label: 'How-To Guides', description: 'Solve specific tasks' },
  { key: 'explanations' as const, label: 'Explanations', description: 'Understand the design' },
  { key: 'references' as const, label: 'References', description: 'Look up technical details' },
]

export function getDocsForSection(section: DocEntry['section']): DocEntry[] {
  return docs.filter((d) => d.section === section).sort((a, b) => a.order - b.order)
}
