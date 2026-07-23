import path from "node:path";
import { fileURLToPath } from "node:url";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const root = path.dirname(fileURLToPath(import.meta.url));

export default {
  entry: "./src/app/main.jsx",
  output: {
    path: path.join(root, "dist"),
    filename: "app.js",
    clean: true,
    publicPath: "/dist/",
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              ["@babel/preset-env", { targets: "defaults" }],
              [
                "@babel/preset-react",
                { runtime: "automatic", development: false },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(png|svg|woff2)$/i,
        type: "asset/resource",
        generator: { filename: "assets/[name][ext]" },
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin({ filename: "app.css" })],
  resolve: { extensions: [".js", ".jsx"] },
  devServer: {
    port: 4173,
    host: "127.0.0.1",
    historyApiFallback: true,
    static: { directory: root, watch: false },
  },
};
