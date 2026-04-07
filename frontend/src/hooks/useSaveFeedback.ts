import { useCallback, useRef, useState } from 'react'
import { getErrorMessage } from '../api/errors'

export type SaveState = 'idle' | 'saving' | 'success' | 'error'

export function useSaveFeedback() {
  const [state, setState] = useState<SaveState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const wrap = useCallback(
    async <T>(fn: () => Promise<T> | void): Promise<T | void> => {
      clearTimeout(timerRef.current)
      setState('saving')
      setErrorMsg('')
      try {
        const result = await fn()
        setState('success')
        timerRef.current = setTimeout(() => setState('idle'), 2000)
        return result
      } catch (err) {
        setState('error')
        setErrorMsg(getErrorMessage(err, 'Save failed'))
      }
    },
    []
  )

  return { state, errorMsg, wrap }
}
