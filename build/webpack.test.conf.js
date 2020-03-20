const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // CSS分离
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserJSPlugin = require("terser-webpack-plugin"); //压缩JS
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');// 打包静态资源

module.exports = {
    mode: 'production', // 自动压缩JS
    entry: path.resolve(__dirname, '../src/main.js'),
    output: {
        path: path.resolve(__dirname, '../dist'),
        publicPath: '',
        filename: 'js/[name].[chunkhash].js',
        chunkFilename: 'js/[name].[chunkhash].js'
    },
    // 开发工具 
    devtool: 'cheap-module-source-map',
    optimization: {
        minimizer: [
          new TerserJSPlugin({}),// 压缩JS
          new OptimizeCSSAssetsPlugin({})// 压缩CSS
        ],
        // 包的分离，分离出非业务逻辑的包
        splitChunks: {
            cacheGroups: {
                vendor: {   // 抽离第三方插件
                    test: /node_modules/,   // 指定是node_modules下的第三方包
                    chunks: 'initial',// initial初始块，async(按需加载块)、all(全部块)，默认为all;
                    name: 'vendor',  // 打包后的文件名，任意命名    
                    // 设置优先级，防止和自定义的公共代码提取时被覆盖，不进行打包
                    priority: 10    
                },
                utils: { // 抽离自己写的公共代码，utils这个名字可以随意起
                    chunks: 'initial',
                    name: 'utils',  // 任意命名
                    minChunks: 2,   // 引用次数最少两次
                    minSize: 0    // 只要超出0字节就生成一个新包
                }
            }
        }
      },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../index.html'),//模板文件的路径
            minify:{
                removeRedundantAttributes:true, // 删除多余的属性
                collapseWhitespace:true, // 折叠空白区域
                removeAttributeQuotes: true, // 移除属性的引号
                removeComments: true, // 移除注释
                collapseBooleanAttributes: true // 省略只有 boolean 值的属性值 例如：readonly checked
            },
            favicon: path.resolve(__dirname, '../favicon.ico')//配置网页图标
        }),
        new VueLoaderPlugin(),
        new webpack.HashedModuleIdsPlugin(),// 实现持久化缓存
        new MiniCssExtractPlugin({
            filename: 'css/[name].[hash].css',
            chunkFilename: 'css/[name].[hash].css',
        }),
        new CopyWebpackPlugin([{
            from:path.resolve(__dirname, '../static'),// 打包的静态资源目录地址
            to:'static' // 打包到dist下面的static
        },{
            from:path.resolve(__dirname, '../README.md'),// 打包的静态资源目录地址
            to:'./README' // 打包到dist下面的static
        }]),
    ],
    // 模版解析配置项
    resolve: {
        // 设置可省略文件后缀名
        extensions: [' ','.js','vue','.json','.jsx'],
        // 查找 module 的话从这里开始查找;
        modules: [path.resolve(__dirname, "../src"), path.resolve(__dirname, "../node_modules")], // 绝对路径;
        // 配置路径映射（别名）
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
        }
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'eslint-loader',
                enforce: 'pre',
                options: {
                    fix: true,
                    formatter: require('eslint-friendly-formatter') // 指定错误报告的格式规范
                }
            },
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "eslint-loader",
                options: {// 这里的配置项参数将会被传递到 eslint 的 CLIEngine 
                    fix: true,
                    formatter: require('eslint-friendly-formatter') // 指定错误报告的格式规范
                }
            },
            {
                test: /\.m?js$/,
                // babel-loader很慢，确保转译尽可能少的文件。使用exclude来排除不需要转译的文件，比如node_modules，也可以使用CacheDirectory选项，将babel-loader提速至少两倍，这会将转移的结果缓存到系统文件
                exclude: /(node_modules|bower_components)/,
                include: path.resolve(__dirname, '../src'),
                use: {
                  loader: 'babel-loader',
                  options: {
                    presets: ['@babel/preset-env'],
                    // babel在每个文件都插入了辅助代码，使代码体积过大，babel对一些公共方法使用了非常小的辅助代码，比如_extend。默认情况下会被添加到每一个需要它的文件中，可以引入babel runtime作为一个独立模块，来避免重复引入，把@babel/runtime安装为一个依赖
                    // 禁用babel自动对每个文件的runtime注入，而是引入@@babel/plugin-transform-runtime并且使所有辅助代码从这里引用。
                    plugins: ['@babel/plugin-transform-runtime'],
                    cacheDirectory: true // 使用缓存
                  } 
                }
            },
            {
                test: /\.(less|css)$/,
                use: [
                    MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'less-loader'
                ]
            },
            {
                test: /\.(png|jp?g|gif|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 10*1024, // 小于10*1024字节的图片打包成base 64图片
                            name:'images/[name].[hash:8].[ext]',
                            publicPath:''
                        }
                    }
                ]
            },
            {
                // 文件依赖配置项——字体图标
                test: /\.(woff|woff2|svg|eot|ttf)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 8192, 
                        name: 'fonts/[name].[ext]?[hash:8]',
                        publicPath:''
                    },
                }],
            }, 
            {
                // 文件依赖配置项——音频
                test: /\.(wav|mp3|ogg)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 8192, 
                        name: 'audios/[name].[ext]?[hash:8]',
                        publicPath:''
                    },
                }],
            }, 
            {
                // 文件依赖配置项——视频
                test: /\.(ogg|mpeg4|webm)?$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 8192, 
                        name: 'videos/[name].[ext]?[hash:8]',
                        publicPath:''
                    },
                }],
            },
        ]
    }
};