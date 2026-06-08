# Changelog

## [1.1.0](https://github.com/esoukarieh-art/ELSAI/compare/v1.0.0...v1.1.0) (2026-06-08)


### ✨ Nouvelles fonctionnalités

* **admin-seo:** édition des drafts longue traîne (titre, méta, markdown) ([24ae70f](https://github.com/esoukarieh-art/ELSAI/commit/24ae70f5289e56abccfecb51d4c80037224753eb))
* **admin/ai:** streaming SSE réel pour la génération d'article ([4a2b9c1](https://github.com/esoukarieh-art/ELSAI/commit/4a2b9c1d1bd9141d54cfad2fdb44afdcb1d2a262))
* **admin/blog:** bibliothèque de prompts IA + génération de brouillon ([d70ccb4](https://github.com/esoukarieh-art/ELSAI/commit/d70ccb49f1aa0f6543f3066d492d7c452887d93e))
* **admin/blog:** éditeur Novel/Tiptap enrichi — slash menu, bubble menu, blocs MDX éditables, IA inline ([d803fb9](https://github.com/esoukarieh-art/ELSAI/commit/d803fb9233ba81853089014ed175fce7b0d1fac2))
* **admin/blog:** IA de mise en page — structure sur sélection, layout global, continuation ++ ([a93e397](https://github.com/esoukarieh-art/ELSAI/commit/a93e397a18d9447adf57d61ad154b7f23db89e69))
* **admin/blog:** indicateur de progression pendant la génération IA ([4d5465f](https://github.com/esoukarieh-art/ELSAI/commit/4d5465fb87fcf42abc3293211655a0d602c19df7))
* **admin/blog:** page de prévisualisation pour brouillons et statuts non publiés ([11df351](https://github.com/esoukarieh-art/ELSAI/commit/11df351287b82b922c0e5cb0bdfb0178de2dca2b))
* **admin/blog:** suppression directe, extrait, scheduler datetime-local, statuts private/archived ([fc31420](https://github.com/esoukarieh-art/ELSAI/commit/fc314200ae69d43fe1c0f13f6f1636dc1c6f5fc4))
* **backend:** expose la version via GET /api/version ([ffb806d](https://github.com/esoukarieh-art/ELSAI/commit/ffb806d0cd530505b40b46f65ac8745bbce06c41))
* roadmap multi-chantiers (démo home, sécurité, glossaire, SEO longue traîne, comptes, PDF, géoloc) ([aa9be51](https://github.com/esoukarieh-art/ELSAI/commit/aa9be5166300d2259ee034d6a0d03d5f39c98fdb))


### 🐛 Corrections

* add email-validator via pydantic[email] extra ([31f0082](https://github.com/esoukarieh-art/ELSAI/commit/31f0082df4f22f4f07d7c2a299288d02e8794319))
* **admin/ai:** format à délimiteurs au lieu de JSON pour génération d'article ([73f16ab](https://github.com/esoukarieh-art/ELSAI/commit/73f16ab2d647b0d12dcd63849ec9ed31e25e3402))
* **admin/ai:** timeout 180s pour la génération d'article complet ([a535240](https://github.com/esoukarieh-art/ELSAI/commit/a53524042d0843e24d560e4b88d3495600299f68))
* **admin/ai:** timeout via with_options() au lieu du kwarg stream() ([6a8e31b](https://github.com/esoukarieh-art/ELSAI/commit/6a8e31b2612c49d2e7f2815075026b8372df241c))
* **admin/help:** embarquer admin-guide.md dans le build standalone ([0c56a9c](https://github.com/esoukarieh-art/ELSAI/commit/0c56a9caf97b838a5ab3e8c458559f92564febda))
* **backend:** migration auto pour conversations.optional_account_id + handler 500 global ([66a5a62](https://github.com/esoukarieh-art/ELSAI/commit/66a5a62e3da2e1339c6b329d0886fb1dd44e96db))
* **cms:** support Postgres in page_contents auto-migration ([1675aed](https://github.com/esoukarieh-art/ELSAI/commit/1675aed47d8360d851ec8382d4473c4718c6a547))
* **prod:** durcir le boot backend et la gestion d'erreur LLM, build ID frontend déterministe ([9b0e2ac](https://github.com/esoukarieh-art/ELSAI/commit/9b0e2ac787d987ad97d37dcc8b076fa618d45684))
* **safety:** distinguer utilisateur en danger vs proche concerné ([3054a53](https://github.com/esoukarieh-art/ELSAI/commit/3054a533556dff94ac8eb3d7b13cec2fcfd72a36))

## Changelog

Toutes les évolutions notables d'ELSAI sont documentées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet
respecte le [Semantic Versioning](https://semver.org/lang/fr/).

Les entrées sont générées automatiquement par
[release-please](https://github.com/googleapis/release-please) à partir des
[Conventional Commits](https://www.conventionalcommits.org/fr/v1.0.0/).
