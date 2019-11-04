module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-uglify-es');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-regex-replace');
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        uglify: {
            dist: {
                files: {
                    'dist/roulette-bot.min.js': ['src/**/*.js']
                }
            }
        },

        jshint: {
            dist: ['src/**/*.js'],
            options: {
              'esversion': 8,
            },
        },

        "regex-replace": {
            dist: {
                src: ['dist/roulette-bot.min.js'],
                actions: [
                    {
                        name: 'remove export',
                        search: 'export\\s',
                        replace: '',
                        flags: 'gm'
                    },{
                        name: 'remove import',
                        search: 'import\\{(?:(?:,)*[aA-zZ]{1,})*\\}from"(?:\\.{1,}(?:\\/)?)*(?:[aA-zZ-](?:\\/)?)*";',
                        replace: '',
                        flags: 'gm'
                    }
                ]
            }
        }
    });
    grunt.registerTask('default', ['uglify', 'jshint', 'regex-replace'])
};