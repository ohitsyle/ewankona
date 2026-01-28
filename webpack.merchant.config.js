// webpack.merchant.config.js - Merchant portal build configuration
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = (env, argv) => {
  const isDev = argv.mode !== 'production';

  return {
  mode: 'development',
  entry: './src/merchant/index.jsx',
  output: {
    path: path.resolve(__dirname, 'nucash-server/public/merchant-dist'),
    filename: 'bundle.js',
    publicPath: isDev ? '/' : '/merchant-dist/',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { loose: true }],
              ['@babel/preset-react', { runtime: 'automatic' }]
            ],
            plugins: [
              ['@babel/plugin-transform-class-properties', { loose: true }],
              ['@babel/plugin-transform-private-methods', { loose: true }],
              ['@babel/plugin-transform-private-property-in-object', { loose: true }]
            ]
          }
        }
      },
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules']
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './nucash-server/public/merchant.html',
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.REACT_APP_GOOGLE_MAPS_API_KEY': JSON.stringify(process.env.REACT_APP_GOOGLE_MAPS_API_KEY),
      'process.env.REACT_APP_API_BASE_URL': JSON.stringify(process.env.REACT_APP_API_BASE_URL),
      'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:3000')
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'nucash-server/public'),
    },
    port: 3002,
    hot: true,
    open: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3000',
        changeOrigin: true,
        timeout: 300000, // 5 minutes for large exports
      }
    ]
  },
  devtool: 'source-map'
  };
};
