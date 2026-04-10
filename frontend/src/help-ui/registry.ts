import { lazy, type ComponentType } from 'react'

export interface HelpEntry {
  slug: string
  title: string
  section: 'getting-started' | 'features' | 'concepts'
  order: number
}

export const helpArticles: HelpEntry[] = [
  // Getting Started
  { slug: 'getting-started/welcome', title: 'Welcome to Chauka', section: 'getting-started', order: 0 },
  { slug: 'getting-started/creating-account', title: 'Creating Your Account', section: 'getting-started', order: 1 },
  { slug: 'getting-started/joining-organisation', title: 'Joining an Organisation', section: 'getting-started', order: 2 },
  { slug: 'getting-started/navigating-chauka', title: 'Navigating the Interface', section: 'getting-started', order: 3 },
  { slug: 'getting-started/your-first-logframe', title: 'Creating Your First Logframe', section: 'getting-started', order: 4 },

  // Feature Walkthroughs
  { slug: 'features/organisations-programs-projects', title: 'Organisations, Programs & Projects', section: 'features', order: 0 },
  { slug: 'features/logframe-overview', title: 'Understanding the Logframe', section: 'features', order: 1 },
  { slug: 'features/result-chains', title: 'Building Result Chains', section: 'features', order: 2 },
  { slug: 'features/indicators-targets', title: 'Indicators & Targets', section: 'features', order: 3 },
  { slug: 'features/data-entry', title: 'Entering Monitoring Data', section: 'features', order: 4 },
  { slug: 'features/activities-workplans', title: 'Activities & Work Plans', section: 'features', order: 5 },
  { slug: 'features/budget-tracking', title: 'Budget Tracking', section: 'features', order: 6 },
  { slug: 'features/indicator-library', title: 'Indicator Library', section: 'features', order: 7 },
  { slug: 'features/disaggregation-analysis', title: 'Disaggregation Analysis', section: 'features', order: 8 },
  { slug: 'features/contribution-analysis', title: 'Contribution Analysis', section: 'features', order: 9 },
  { slug: 'features/dashboard-reports', title: 'Dashboard & Reports', section: 'features', order: 10 },
  { slug: 'features/team-roles-permissions', title: 'Team Roles & Permissions', section: 'features', order: 11 },
  { slug: 'features/exporting-data', title: 'Exporting Data', section: 'features', order: 12 },

  // M&E Concepts
  { slug: 'concepts/what-is-me', title: 'What is M&E?', section: 'concepts', order: 0 },
  { slug: 'concepts/logframe-approach', title: 'The Logframe Approach', section: 'concepts', order: 1 },
  { slug: 'concepts/results-hierarchy', title: 'Understanding Results Hierarchies', section: 'concepts', order: 2 },
  { slug: 'concepts/indicators-explained', title: 'Indicators Explained', section: 'concepts', order: 3 },
  { slug: 'concepts/theory-of-change', title: 'Theory of Change', section: 'concepts', order: 4 },
  { slug: 'concepts/data-collection', title: 'Data Collection & Quality', section: 'concepts', order: 5 },
  { slug: 'concepts/reporting-learning', title: 'Reporting & Learning', section: 'concepts', order: 6 },
]

const modules = import.meta.glob('../help/**/*.mdx') as Record<string, () => Promise<{ default: ComponentType }>>

const componentCache: Record<string, React.LazyExoticComponent<ComponentType>> = {}

export function getHelpComponent(slug: string): React.LazyExoticComponent<ComponentType> | null {
  if (componentCache[slug]) return componentCache[slug]
  const path = `../help/${slug}.mdx`
  const loader = modules[path]
  if (!loader) return null
  const component = lazy(loader)
  componentCache[slug] = component
  return component
}

export const helpSections = [
  { key: 'getting-started' as const, label: 'Getting Started', description: 'Set up and get running' },
  { key: 'features' as const, label: 'Feature Walkthroughs', description: 'Learn how each feature works' },
  { key: 'concepts' as const, label: 'M&E Concepts', description: 'Understand monitoring & evaluation' },
]

export function getHelpForSection(section: HelpEntry['section']): HelpEntry[] {
  return helpArticles.filter((d) => d.section === section).sort((a, b) => a.order - b.order)
}
