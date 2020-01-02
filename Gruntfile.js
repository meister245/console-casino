module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        babel: {
            options: {
                sourceMap: true,
                presets: ['@babel/preset-env']
            },
            dist: {
                files: [{
                    "expand": true,
                    "cwd": "src",
                    "src": ["**/*.js"],
                    "dest": "build/",
                    "ext": "-compiled.js"
                }]
            },
        },
        uglify: {
            dist: {
                options: {
                    sourceMap: true,
                    sourceMapName: 'build/sourceMap.map'
                },
                src: 'build/**/*.js',
                dest: 'dist/console-casino.min.js'
            }
        },
        jshint: {
            dist: ['src/**/*.js'],
            options: {
                'esversion': 8,
            },
        }
    });

    grunt.registerTask('default', ['jshint', 'babel', 'uglify'])
};