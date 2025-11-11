// postcss.config.cjs
module.exports = {
    plugins: {
      // This tells PostCSS to run the Tailwind plugin first
      'tailwindcss': {},
      'autoprefixer': {},
    },
  };