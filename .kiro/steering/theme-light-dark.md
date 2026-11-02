---
inclusion: always
---

# Theme: Light/Dark Mode Rules

## Core Rule
Every element that sets a background color or text color MUST provide both a light-mode default and a `dark:` variant. Never use bare `bg-gray-800`, `bg-gray-900`, or `text-white` on containers, inputs, modals, or cards without a corresponding light-mode class.

## Required Pattern for UI Elements

### Containers / Cards / Modals
```
bg-white dark:bg-gray-900 text-gray-900 dark:text-white
border border-gray-200 dark:border-gray-700
```

### Inputs / Textareas
```
bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white
border-gray-300 dark:border-gray-700
placeholder-gray-400 dark:placeholder-gray-400
```

### Secondary / Inner Panels
```
bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
border border-gray-200 dark:border-gray-700
```

### Body Text
```
text-gray-700 dark:text-gray-300
```

### Muted / Meta Text
```
text-gray-500 dark:text-gray-400
```

### Headings
```
text-gray-900 dark:text-white
```

### Buttons (ghost/icon)
```
text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
```

### Hover states on list rows
```
hover:bg-gray-100 dark:hover:bg-gray-800
```

### Loading skeletons / pulse placeholders
```
bg-gray-200 dark:bg-gray-700   (NOT bg-gray-800 alone)
```

## Anti-Patterns to Avoid

| Anti-pattern | Problem | Fix |
|---|---|---|
| `bg-gray-900 text-white` | Black in light mode | `bg-white dark:bg-gray-900 text-gray-900 dark:text-white` |
| `bg-gray-800 text-white` | Very dark in light mode | `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white` |
| `bg-black` on cards | Solid black card in light mode | `bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800` |
| `text-white` without `dark:` on light bg | Invisible text in light mode | `text-gray-900 dark:text-white` |
| `text-gray-400` as body/description text | Too light in light mode, nearly invisible | `text-gray-600 dark:text-gray-400` |
| `text-gray-300` as body text | Too light in light mode | `text-gray-700 dark:text-gray-300` |
| `dark:text-*` only with no light-mode pair | Text has no color in light mode | Always add both sides |
| `text-gray-X dark:text-gray-Y` where Y > X | Inverted: lighter in dark, darker in light | Swap: `text-gray-500 dark:text-gray-400` |
| Gradient fading `to-white` | Card edge invisible on white page bg | Use `to-gray-100 dark:to-gray-800` |
| `bg-gray-700 bg-opacity-40` on panels inside gradient containers | Dark panel in light mode | Use `bg-white/30 dark:bg-gray-700/30` |
| `bg-gray-700/800` on wager/task list items inside gradient containers | Dark items in light mode | Use `bg-white/20 hover:bg-white/30` |
| `hover:bg-gray-300` without dark hover | Light gray hover vanishes on dark bg | `hover:bg-gray-200 dark:hover:bg-gray-800` |
| Typo in dark: variant (e.g. `dark:to-reds-700`) | Dark variant silently ignored | Always verify dark: class names compile |
| Option/card with no `bg-*` at all | Inherits wrong bg from parent | Add `bg-white dark:bg-gray-900` explicitly |
| CTA button `bg-purple-400` | Insufficient contrast with white text | Use `bg-purple-600 hover:bg-purple-700` |

## Gradient Containers (Sidebar widgets)

Widgets with colored gradients (yellow→red, purple→gray) work differently — they always provide their own background. Inside these:
- Text: use `text-white` (gradient provides contrast in both modes)
- Inner list items: use `bg-white/20 hover:bg-white/30` (opacity overlay, not hard dark colors)
- Expanded panels: use `bg-white/30 dark:bg-gray-700/30`

## Files Fixed (historical)
- `components/wagers/WagerDetails.tsx` — bet amount input, CTA button contrast
- `components/common/DepositModal.tsx` — entire modal + inner panels + preset buttons
- `components/common/NotificationModal.tsx` — entire modal + notification list items
- `components/wagers/PopularWagersLeaderboard.tsx` — card text color, skeleton bg, hover state, meta text
- `components/common/Level.tsx` — gradient fade, expanded panel bg
- `components/common/SideWagers.tsx` — gradient typo, list item bg
- `components/common/SideTask.tsx` — list item bg
- `components/common/SideProfile.tsx` — inverted button color
- `components/wagers/BettingOptions.tsx` — option card bg, label text dark pairs, option name heading
- `components/main/HowItWorks.tsx` — MobileStep bg-black, three text-gray-400 body text instances
- `components/leaderboard/LeaderboardWidget.tsx` — inverted rank number color
- `components/friends/FriendshipButton.tsx` — missing dark pair on button text
- `components/friends/FriendsView.tsx` — missing dark pair on cancel button
- `components/common/ProfileSettings.tsx` — heading missing light-mode color
