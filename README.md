# .

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Quiz data model

The quiz experience is modeled through the TypeScript types defined in `src/types/quiz.ts`:

- `Quiz` aggregates metadata (title, author, tags, difficulty) and the ordered list of `Question` entries plus optional `QuizSettings` (shuffle, attempts, timers).
- `Question` captures the prompt, `QuestionType` (now fixed to `multiple_choice`), mandatory `Choice` options plus constraints such as `selectionMode`, `minSelections`/`maxSelections`, scoring weight and per-question metadata.
- User activity is stored via `QuizAttempt`, which keeps timestamps, status, total score and the array of `UserAnswer` entries for each question.
- A `UserAnswer` records either selected `UserAnswerChoice` values (for choice-based questions) or free-form text plus auxiliary flags (`isSkipped`, `confidence`).

### Possible extensions

- Track versioning (`quizVersion`) to keep historical attempts aligned with the question set that was shown.
- Localize prompts and choices by replacing strings with translation maps keyed by locale (`Record<string, string>`).
- Support rich media by adding optional `media` descriptors (images, audio, video) on questions and choices.
- Persist evaluation artifacts (per-question feedback, rubric results) inside `QuizAttempt.metadata` for analytics dashboards.
