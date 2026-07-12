# nuxt-media-library-layer

Nuxt Layer réutilisable fournissant l'interface complète de la médiathèque : navigation en dossiers, recherche, upload, sélection multiple, suppression groupée, et un mode "sélecteur" pour insérer un média depuis n'importe quel formulaire (avatar, thumbnail, etc.).

## Pourquoi ce layer

- **Deux modes d'usage sans dupliquer le code** : une page dédiée en plein écran (`index.vue` du projet consommateur) et une modal de sélection (`FileUploadModal.vue`, utilisable dans n'importe quel formulaire) partagent exactement les mêmes composants et le même composable.
- **Logique découplée de l'UI** : `useMediaLibrary` ne connaît rien de la présentation — il expose uniquement de l'état réactif et des actions, ce qui permet de construire des interfaces différentes par-dessus sans réécrire la logique métier.
- **Zéro dépendance propre** : le layer n'installe aucun package supplémentaire — il s'appuie sur les modules déjà présents dans le projet hôte (voir Prérequis).

## Prérequis du projet hôte

Ce layer ne fonctionne pas de façon autonome — il s'appuie sur des modules Nuxt qui doivent être installés et configurés côté projet consommateur :

- [`@nuxt/ui`](https://ui.nuxt.com) — composants `UButton`, `UModal`, `UInput`, `UFileUpload`, `UTree`, `UPagination`, `UCheckbox`, `UPopover`, `UBadge`, `UFieldGroup`, `UScrollArea`, `USeparator`
- [`nuxt-auth-sanctum`](https://github.com/wobsoriano/nuxt-auth-sanctum) — pour `useSanctumClient()`
- Le backend [`laravel-media-library`](https://github.com/skal-doe/laravel-media-library) installé et exposant ses routes

## Installation

### 1. Authentification (dépôt privé)

Nuxt télécharge les layers distants via [giget](https://github.com/unjs/giget), qui a son propre mécanisme d'authentification (indépendant de Composer/Git). Crée un **fine-grained personal access token** GitHub :

1. https://github.com/settings/personal-access-tokens/new
2. Repository access → *Only select repositories* → `nuxt-media-library-layer`
3. Permissions → *Repository permissions* → `Contents: Read-only`
4. Exporte-le dans ton shell :

```bash
echo 'export GIGET_AUTH=ton_token_github' >> ~/.bashrc
source ~/.bashrc
```

> Si tu utilises déjà un token pour `laravel-media-library`, tu peux soit l'étendre à ce repo (édite le token existant côté GitHub, ajoute `nuxt-media-library-layer` à la liste des repos autorisés), soit en créer un second dédié.

### 2. Étendre le layer dans `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    "@nuxt/ui",
    "nuxt-auth-sanctum",
    // ... autres modules du projet
  ],

  extends: [
    "github:skal-doe/nuxt-media-library-layer#v0.1.0",
  ],
});
```

> Pas besoin de `{ install: true }` — le layer ne déclare aucune dépendance npm propre, donc rien à installer côté layer.

En développement local, pointe vers un chemin relatif pour voir tes modifications sans re-tag :

```typescript
extends: ["../nuxt-media-library-layer"],
```

### 3. Configurer le préfixe d'API

Le composable appelle l'API sous `api/admin/...` par défaut, aligné avec `route_prefix` du package Laravel :

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      mediaLibraryApiPrefix: "api/admin",
    },
  },
});
```

## Composants disponibles

Auto-importés dès que le layer est étendu — aucun import manuel nécessaire.

| Composant | Usage |
|---|---|
| `MediaLibrary` | Vue complète (sidebar dossiers + grille), utilisable en page ou en modal |
| `FileUploadModal` | Modal de sélection d'un média, avec bouton déclencheur par défaut |
| `FormFileUploadBox` | Champ de formulaire prêt à l'emploi (aperçu + bouton "Téléverser") pour un média unique |
| `MediaGrid` | Grille de dossiers + médias avec pagination |
| `MediaCard` / `MediaFolderCard` | Cartes individuelles (média / dossier) |
| `MediaBreadcrumb` | Fil d'ariane de navigation |
| `MediaFolderTree` | Arbre de dossiers (sidebar) |
| `MediaFolderPickerModal` | Modal de sélection de dossier de destination (déplacement) |
| `MediaSearchBar` | Barre de recherche |
| `MediaUploadForm` | Formulaire d'upload multi-fichiers |

## Composables disponibles

- **`useMediaLibrary()`** — état et actions complets : navigation, recherche, pagination, upload, suppression, déplacement, sélection multiple. Voir le code source pour la liste exhaustive des valeurs exposées.
- **`useConfirmAction()`** — petit helper générique pour gérer un état "en attente de confirmation / en cours de traitement" (utilisé par les actions de suppression).

## Exemples d'usage

### Page dédiée médiathèque

```vue
<script setup lang="ts">
const { medias, folders, pending, loadInitial, /* ... */ } = useMediaLibrary()
onMounted(() => loadInitial())
</script>

<template>
  <MediaLibrary />
</template>
```

### Champ "avatar" dans un formulaire

```vue
<script setup lang="ts">
const avatar = ref<{ id: string; url: string } | null>(null)
</script>

<template>
  <FormFileUploadBox v-model="avatar" />
</template>
```

`avatar.value?.id` est la valeur à envoyer au backend (ex. via `syncMedia`).

## Types

Les interfaces `Media` et `MediaFolder` sont exportées depuis le layer — pas besoin de les redéfinir dans le projet consommateur :

```typescript
import type { Media, MediaFolder } from "#layers/nuxt-media-library-layer/types"
```

## Dépannage

**`ERROR spawn pnpm ENOENT`** → retire `{ install: true }` de la déclaration `extends` ; ce layer n'a pas de dépendances propres à installer.

**`404 Not Found` au téléchargement du layer** → vérifie dans l'ordre : que `GIGET_AUTH` est bien chargé dans le terminal (`echo $GIGET_AUTH`), que le tag existe bien sur GitHub, et que le token a accès à ce repo précis (un repo privé inaccessible renvoie un 404, pas un 403, par sécurité).

**Un composant local masque celui du layer** → Nuxt donne priorité aux fichiers du projet consommateur en cas de nom identique. Si un composant du layer ne semble pas à jour après une mise à jour de version, vérifie qu'aucun fichier local du projet ne porte le même nom dans `components/`.

## Versionning

Suit [SemVer](https://semver.org). Fixe un tag explicite (`#v0.1.0`) dans `extends` plutôt que de pointer sur une branche, pour éviter qu'une évolution du layer sur un projet ne casse silencieusement les autres.