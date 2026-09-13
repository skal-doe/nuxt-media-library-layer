/**
 * Adaptateur HTTP universel pour la médiathèque :
 * 1. Détecte et utilise en priorité nuxt-auth-sanctum s'il est actif dans le projet hôte
 *    (gestion automatique du token CSRF XSRF-TOKEN, baseURL Laravel et cookies de session).
 * 2. Si nuxt-auth-sanctum n'est pas installé, bascule élégamment sur le $fetch natif de Nuxt
 *    avec transmission des cookies de session (credentials: 'include').
 */
export function useMediaLibraryClient(): typeof $fetch {
  const nuxtApp = useNuxtApp()

  // 1. Détection via $sanctumClient injecté par nuxt-auth-sanctum sur le NuxtApp
  const injectedSanctumClient = (nuxtApp as Record<string, unknown>).$sanctumClient
  if (injectedSanctumClient) {
    return injectedSanctumClient as typeof $fetch
  }

  // 2. Détection via useSanctumClient auto-importé globalement
  const sanctumFn = (globalThis as Record<string, unknown>).useSanctumClient
  if (typeof sanctumFn === 'function') {
    return sanctumFn() as typeof $fetch
  }

  // 3. Fallback universel : $fetch natif de Nuxt
  return $fetch.create({
    credentials: 'include',
    retry: 0,
  })
}
