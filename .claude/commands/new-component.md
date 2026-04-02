# /new-component — Scaffold a React component

Scaffold a typed, TailwindCSS-styled React component following Chauka conventions.

## Usage
```
/new-component <ComponentName> [page|component|hook]
```
Example: `/new-component RatingBadge component` or `/new-component ResultRow component`

## Steps

### 1. Determine the right location
- Page-level (route): `frontend/src/pages/<ComponentName>.tsx`
- Shared/reusable: `frontend/src/components/<ComponentName>.tsx`
- Data hook: `frontend/src/hooks/use<Domain>.ts`

### 2. Component template
```tsx
// frontend/src/components/<ComponentName>.tsx
import { FC } from 'react'

interface <ComponentName>Props {
  // define props here
}

const <ComponentName>: FC<<ComponentName>Props> = ({ /* destructure props */ }) => {
  return (
    <div className="">
      {/* component content */}
    </div>
  )
}

export default <ComponentName>
```

### 3. Hook template (if data fetching is needed)
```typescript
// frontend/src/hooks/use<Domain>.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get<Domain>, create<Domain>, update<Domain>, delete<Domain> } from '../api/<domain>'

export const use<Domain>s = (logframeId: number) =>
  useQuery({
    queryKey: ['<domain>s', logframeId],
    queryFn: () => get<Domain>s(logframeId),
  })

export const useCreate<Domain> = (logframeId: number) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: create<Domain>,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['<domain>s', logframeId] }),
  })
}
```

### 4. API client template
```typescript
// frontend/src/api/<domain>.ts
import axios from 'axios'
import type { <Domain>Read, <Domain>Create, <Domain>Update } from '../types/<domain>'

const base = (logframeId: number) => `/api/logframes/${logframeId}/<domain>s`

export const get<Domain>s = (logframeId: number) =>
  axios.get<<Domain>Read[]>(base(logframeId)).then(r => r.data)

export const create<Domain> = (logframeId: number, data: <Domain>Create) =>
  axios.post<<Domain>Read>(base(logframeId), data).then(r => r.data)

export const update<Domain> = (logframeId: number, id: number, data: <Domain>Update) =>
  axios.patch<<Domain>Read>(`${base(logframeId)}/${id}`, data).then(r => r.data)

export const delete<Domain> = (logframeId: number, id: number) =>
  axios.delete(`${base(logframeId)}/${id}`)
```

### 5. Verify types
```bash
cd frontend && npm run type-check
```

## Styling Guidelines
- Use TailwindCSS utility classes; no inline styles
- Follow the existing color palette in `index.css`
- Loading states: show a spinner or skeleton (e.g., `animate-pulse bg-gray-200`)
- Error states: red border, small error message below the element
- Match the Kashana MIS visual style: clean, tabular, minimal decorative elements
