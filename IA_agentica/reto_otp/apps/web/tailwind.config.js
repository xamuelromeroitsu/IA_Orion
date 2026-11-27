export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        orion: {
          background: '#0B1F3A',
          surface: '#102A4C',
          blue: '#2563EB',
          yellow: '#FACC15',
          text: '#E8F0FA'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 18px 40px -26px rgba(0, 0, 0, 0.75)'
      },
      borderRadius: {
        card: '1rem'
      }
    }
  },
  plugins: []
}
