export function useConfirmAction<T extends string>() {
  const confirmingId = ref<T | null>(null)
  const processingId = ref<T | null>(null)

  const ask = (id: T) => { confirmingId.value = id }
  const cancel = () => { confirmingId.value = null }

  const confirm = async (id: T, action: () => Promise<void>) => {
    processingId.value = id
    try {
      await action()
    } finally {
      processingId.value = null
      confirmingId.value = null
    }
  }

  return { confirmingId, processingId, ask, cancel, confirm }
}