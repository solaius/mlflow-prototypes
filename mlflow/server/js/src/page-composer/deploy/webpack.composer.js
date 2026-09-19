const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const jsDir = path.resolve(__dirname, '..', '..', '..');
const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'composer-entry.tsx'),
  output: {
    path: path.resolve(jsDir, 'build-composer'),
    filename: isDev ? 'composer.js' : 'composer.[contenthash:8].js',
    clean: true,
  },
  devServer: {
    port: 4000,
    hot: true,
    open: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: (error) => !error?.message?.includes('ResizeObserver'),
      },
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
    alias: {
      '@mlflow/mlflow': path.resolve(jsDir),
      '@databricks/design-system': path.resolve(jsDir, 'vendor', 'design-system'),
      '@databricks/web-shared': path.resolve(jsDir, 'vendor', 'web-shared'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|jsx?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              ['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react' }],
              '@babel/preset-typescript',
            ],
            plugins: ['@emotion/babel-plugin'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg|woff|woff2|eot|ttf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'composer.html'),
      filename: 'index.html',
    }),
  ],
  performance: {
    hints: false,
  },
};
