# AgentBrain Dashboard

3D visualization dashboard for AgentBrain cognitive architecture.

## Features

- **3D Brain Model**: Interactive low-poly brain with 7 cognitive regions
- **Real-time Activity**: Regions pulse and glow when active
- **Neural Pathways**: Animated connections showing information flow
- **Personality Radar**: Live personality trait visualization
- **Stats Panel**: Memory, skills, motivation, and emotional state
- **Region Details**: Click any brain region for detailed information
- **Dark/Light Mode**: Toggle between themes
- **Mobile Friendly**: Responsive WebGL rendering

## Tech Stack

- React 18 + TypeScript
- React Three Fiber (3D rendering)
- Recharts (2D charts)
- Tailwind CSS
- Vite

## Development

```bash
npm install
npm run dev
```

Dashboard runs on http://localhost:3001

## Production Build

```bash
npm run build
npm run preview
```

## Brain Data

The dashboard reads brain state from the parent `brain/` folder:
- `personality.md` - Personality traits
- `emotional/state.md` - Current mood and emotions
- `skills/proficiency.md` - Skill levels
- `reward/motivation_scores.md` - Motivation metrics
- `memory/*.md` - Memory system data

Currently uses mock data when brain files are not available.

## Embed Mode

To embed the dashboard in your own site:

```html
<iframe src="http://localhost:3001" width="100%" height="800px" frameborder="0"></iframe>
```
