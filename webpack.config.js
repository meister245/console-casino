const path = require('path')

module.exports = {
  entry: {
    playtechRoulette: ['./src/client/main/playtechRoulette.ts'],
  }, 
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'client/[name].min.js',
    path: path.resolve(__dirname, 'dist')
  }
}
