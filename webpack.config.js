const path = require('path')

module.exports = {
  entry: './src/client/bot/roulette.ts',
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
    filename: 'client.min.js',
    path: path.resolve(__dirname, 'dist')
  }
}
