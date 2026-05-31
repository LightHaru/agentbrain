/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brain: {
          memory: '#8B5CF6',
          emotion: '#EC4899',
          executive: '#3B82F6',
          reward: '#10B981',
          reflection: '#F59E0B',
          skill: '#06B6D4',
          routing: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
