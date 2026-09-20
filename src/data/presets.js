export const presets = [
  {
    id: 'relax',
    label: 'Relax',
    frequency: 26,
    intensity: 34,
    duration: 600,
    program: [
      { progress: 0, frequency: 22, intensity: 26 },
      { progress: 0.35, frequency: 26, intensity: 34 },
      { progress: 0.72, frequency: 20, intensity: 28 },
      { progress: 1, frequency: 16, intensity: 18 }
    ]
  },
  {
    id: 'recovery',
    label: 'Recovery',
    frequency: 42,
    intensity: 58,
    duration: 900,
    program: [
      { progress: 0, frequency: 32, intensity: 42 },
      { progress: 0.25, frequency: 42, intensity: 58 },
      { progress: 0.7, frequency: 48, intensity: 64 },
      { progress: 1, frequency: 30, intensity: 36 }
    ]
  },
  {
    id: 'deep',
    label: 'Deep',
    frequency: 66,
    intensity: 82,
    duration: 720,
    program: [
      { progress: 0, frequency: 50, intensity: 60 },
      { progress: 0.3, frequency: 66, intensity: 82 },
      { progress: 0.76, frequency: 72, intensity: 90 },
      { progress: 1, frequency: 44, intensity: 52 }
    ]
  }
];
