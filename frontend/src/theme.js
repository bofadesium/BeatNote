// Traffic-light palette. Never rely on colour alone: each status also has an icon + word.
export const STATUS = {
  green: { fg: '#146c3e', bg: '#e6f4ec', border: '#8fd1ab', solid: '#1f9d55', icon: '✓', word: 'Normal' },
  yellow: { fg: '#7a5500', bg: '#fff4d6', border: '#f0cf75', solid: '#e0a000', icon: '!', word: 'Caution' },
  red: { fg: '#a31d14', bg: '#fde8e6', border: '#f0a39d', solid: '#d6342c', icon: '✕', word: 'Critical' },
};
export const RANK = { green: 0, yellow: 1, red: 2 };
export const worst = (list) => list.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), 'green');
