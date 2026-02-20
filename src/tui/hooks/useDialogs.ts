import { useState, useCallback, useRef, useEffect } from "react"

interface DialogState<T = any> {
  type: "confirm" | "input" | "list" | null
  data: T
  resolve: ((value: any) => void) | null
}

export function useDialogs() {
  const [dialogState, setDialogState] = useState<DialogState>({ type: null, data: {}, resolve: null })

  const showConfirmDialog = useCallback((title: string, message: string): Promise<boolean | null> => {
    return new Promise((resolve) => {
      setDialogState({ type: "confirm", data: { title, message }, resolve })
    })
  }, [])

  const showInputDialog = useCallback((
    title: string,
    message: string,
    defaultValue: string = "",
    required: boolean = false
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({ type: "input", data: { title, message, defaultValue, required }, resolve })
    })
  }, [])

  const showListDialog = useCallback((
    title: string,
    choices: { name: string; value: string }[]
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setDialogState({ type: "list", data: { title, choices }, resolve })
    })
  }, [])

  const closeDialog = useCallback((result: any) => {
    if (dialogState.resolve) {
      dialogState.resolve(result)
    }
    setDialogState({ type: null, data: {}, resolve: null })
  }, [dialogState.resolve])

  return {
    dialogState,
    showConfirmDialog,
    showInputDialog,
    showListDialog,
    closeDialog
  }
}
