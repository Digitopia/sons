module.exports = {
    publicPath: '/sons/',
    pwa: {
        themeColor: '#F7BC3D',
    },
    configureWebpack: {
        devtool: 'source-map',
    },
    // Copy files into dist folder
    chainWebpack: config => {
        config.plugin('copy').tap(args => {
            args[0].push({
                from: 'audios',
                to: 'audios',
                toType: 'dir',
                ignore: ['.DS_Store'],
            })
            args[0].push({
                from: 'admin',
                to: 'admin',
                toType: 'dir',
                ignore: ['.DS_Store'],
            })
            return args
        })
    },
}
