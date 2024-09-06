const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // Para gerar o HTML
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // Para limpar o diretório de saída

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/', // Necessário para configuração do devServer
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'source-map-loader',
      },
    ],
  },
  devtool: 'source-map',
  devServer: {
    static: path.join(__dirname, 'dist'), // Atualizado para versões recentes do Webpack
    compress: true,
    port: 9000,
    historyApiFallback: true, // Necessário para aplicações React SPA
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Path para seu template HTML
    }),
    new CleanWebpackPlugin(), // Limpa o diretório dist antes de cada build
  ],
};
