# nuxt-media-library-layer

Nuxt Layer réutilisable fournissant l'interface complète de la médiathèque : navigation en dossiers, recherche, upload, sélection multiple, suppression groupée, et un mode "sélecteur" pour insérer un média depuis n'importe quel formulaire (avatar, thumbnail, etc.).

## Pourquoi ce layer

- **Deux modes d'usage sans dupliquer le code** : une page dédiée en plein écran (`index.vue` du projet consommateur) et une modal de sélection (`FileUploadModal.vue`, utilisable dans n'importe quel formulaire) partagent exactement les mêmes composants et le même composable.
- **Logique découplée de l'UI** : `useMediaLibrary` ne connaît rien de la présentation — il expose uniquement de l'état réactif et des actions, ce qui permet de construire des interfaces différentes par-dessus sans réécrire la logique métier.
- **Zéro dépendance propre** : le layer n'installe aucun package supplémentaire — il s'appuie sur les modules déjà présents dans le projet hôte (voir Prérequis).

## Prérequis du projet hôte

Ce layer ne fonctionne pas de façon autonome — il s'appuie sur des modules Nuxt qui doivent être installés et configurés côté projet consommateur :

- [`@nuxt/ui`](https://ui.nuxt.com) — composants Nuxt UI
- [`nuxt-auth-sanctum`](https://github.com/wobsoriano/nuxt-auth-sanctum) *(optionnel)* — si présent, le layer l'utilise automatiquement pour gérer les cookies de session et le token CSRF. En son absence, le layer bascule de façon transparente sur le client natif `$fetch` de Nuxt.
- Le backend [`laravel-media-library`](https://github.com/skal-doe/laravel-media-library) installé et exposant ses routes d'API.

## Installation

### 1. Installer le paquet

```bash
npm install @skaldoe/nuxt-media-library-layer
# ou : pnpm add / yarn add @skaldoe/nuxt-media-library-layer
```

### 2. Étendre le layer dans `nuxt.config.ts`

```typescript
export default defineNuxtConfig({
  modules: [
    "@nuxt/ui",
    // "nuxt-auth-sanctum", // Optionnel : si votre backend utilise Laravel Sanctum
    // ... autres modules du projet
  ],

  extends: [
    "@skaldoe/nuxt-media-library-layer",
  ],
});
```

<details>
<summary>Installer une version de développement (sans passer par npm)</summary>

Nuxt peut aussi étendre le layer directement depuis le dépôt GitHub (dépôt public, aucune authentification requise), utile pour tester une branche ou un tag pas encore publié sur npm :

```typescript
extends: ["github:skal-doe/nuxt-media-library-layer#v0.2.0"], // ou "#main"
```

> Pas besoin de `{ install: true }` avec cette méthode — le layer ne déclare aucune dépendance npm propre, donc rien à installer côté layer.

En développement local, pointez vers un chemin relatif pour voir vos modifications en direct :

```typescript
extends: ["../nuxt-media-library-layer"],
```

</details>

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
| `MediaLibrary` | Vue complète (sidebar dossiers, corbeille, grille, barre de sélection multiple) |
| `FileUploadModal` | Modal de sélection de média (supporte `multiple` pour les galeries) |
| `FormFileUploadBox` | Champ de formulaire prêt à l'emploi (mode unique ou galerie `multiple`) avec aperçu adaptatif |
| `FormMediaGallery` | Galerie de formulaire avancée : réorganisation (← / →), badge couverture, suppression rapide |
| `MediaGrid` | Grille de dossiers + médias avec pagination et support Corbeille |
| `MediaCard` / `MediaFolderCard` | Cartes individuelles (médias avec détection type MIME images/docs/audio/vidéo, dossiers) |
| `MediaBreadcrumb` | Fil d'ariane de navigation |
| `MediaFolderTree` | Arbre de dossiers (sidebar), chargé à la demande niveau par niveau au dépliage de chaque nœud |
| `MediaFolderPickerModal` | Modal de sélection de dossier de destination (déplacement unitaire ou groupé), même chargement à la demande |
| `MediaFolderTreeNode` | Nœud récursif interne partagé par `MediaFolderTree` et `MediaFolderPickerModal` (usage direct rarement nécessaire) |
| `MediaPreviewModal` | Visionneuse universelle grand format (Lightbox) : zoom photo, player vidéo/audio, iframe PDF |
| `MediaSearchBar` | Barre de recherche |
| `MediaUploadForm` | Formulaire d'upload multi-fichiers |

## Composables disponibles

- **`useMediaLibrary()`** — état et actions complets :
  - **Navigation & Recherche** : `currentFolderId`, `folders`, `medias`, `breadcrumb`, `runSearch()`, `clearSearch()`.
  - **Gestion de la Corbeille** : `isTrashView`, `setTrashView(boolean)`, `restoreMedia(id)`, `forceDeleteMedia(id)`.
  - **Actions Groupées (Bulk Actions)** : `selectedMediaIds`, `isAllSelected`, `toggleSelectAllOnPage()`, `deleteSelectedMedias()`, `restoreSelectedMedias()`, `forceDeleteSelectedMedias()`, `bulkMoveMedias()`.
  - **Upload & Déplacement** : `uploadFiles()`, `moveMedia()`, `createFolder()`, `deleteFolder()`, `renameFolder()`.
- **`useMediaFolderTree()`** — cache par niveau de l'arbre des dossiers (`getChildren(parentId)`, `fetchChildren(parentId)`, `isLoading(parentId)`, `invalidate(parentId)`, `refresh(parentId)`). Une seule instance doit être créée et partagée (ex: par `MediaLibrary.vue`) entre la sidebar et la modal de déplacement pour qu'elles voient un cache cohérent — c'est déjà le cas dans `MediaLibrary` fourni par le layer.
- **`useConfirmAction()`** — helper générique pour gérer un état de confirmation.

## Exemples d'usage

### 1. Page dédiée médiathèque

```vue
<script setup lang="ts">
const { medias, folders, pending, loadInitial } = useMediaLibrary()
onMounted(() => loadInitial())
</script>

<template>
  <MediaLibrary />
</template>
```

### 2. Champ "avatar" ou "thumbnail" dans un formulaire (Média unique)

```vue
<script setup lang="ts">
const avatar = ref<{ id: string; url: string } | null>(null)
</script>

<template>
  <FormFileUploadBox v-model="avatar" label="Téléverser un avatar" />
</template>
```

### 3. Champ d'upload simple ou multiple (`FormFileUploadBox`)

```vue
<script setup lang="ts">
const avatar = ref<{ id: string; url: string } | null>(null)
</script>

<template>
  <FormFileUploadBox v-model="avatar" label="Téléverser un avatar" />
</template>
```

### 4. Galerie photo avancée avec réorganisation (`FormMediaGallery`)

Idéal pour les fiches produits e-commerce ou portfolios, permettant de réordonner les images et de définir la photo de couverture principale (liée avec `syncMedias()` du trait `HasMedia`) :

```vue
<script setup lang="ts">
const productPhotos = ref<{ id: string; url: string }[]>([])
</script>

<template>
  <FormMediaGallery
    v-model="productPhotos"
    label="Photos du produit"
    hint="La première photo sert de photo de couverture sur la boutique."
    :max="10"
    allow-cover
  />
</template>
```

Pour synchroniser côté Laravel :
```php
$product->syncMedias(collect($request->input('photos'))->pluck('id')->all(), 'gallery');
```

## Types

Les interfaces `Media` et `MediaFolder` sont exportées depuis le layer — pas besoin de les redéfinir dans le projet consommateur :

```typescript
import type { Media, MediaFolder } from "#layers/nuxt-media-library-layer/types"
```

## Dépannage

**`ERROR spawn pnpm ENOENT`** (méthode `github:...`) → retire `{ install: true }` de la déclaration `extends` ; ce layer n'a pas de dépendances propres à installer.

**`404 Not Found` au téléchargement du layer** (méthode `github:...`) → vérifie que le tag ou la branche existe bien sur le dépôt GitHub (ex: `#v0.2.0` ou `#main`).

**Un composant local masque celui du layer** → Nuxt donne priorité aux fichiers du projet consommateur en cas de nom identique. Si un composant du layer ne semble pas à jour après une mise à jour de version, vérifie qu'aucun fichier local du projet ne porte le même nom dans `components/`.

## Versionning

Suit [SemVer](https://semver.org). Fixe une contrainte de version explicite dans ton `package.json` (`^0.2.0`, pas `latest`) une fois ton intégration stabilisée, pour éviter qu'une évolution du layer sur un projet ne casse silencieusement les autres.