export class CommonBot {
    constructor() {
        this.tasks = {};
    }

    createTask(taskID, gameType, strategyName, bagSize) {
        if (taskID in this.tasks) {
            throw new Error('existing task ID: ' + taskID);
        }

        this.tasks[taskID] = {
            active: true,
            createTime: Math.floor(Date.now() / 1000),
            game: gameType,
            bagSize: bagSize,
            strategy: strategyName,
            results: {}
        };

        console.log('created', 'taskID', taskID);
    }

    generateTaskID() {
        return Math.random().toString(36).substr(2, 9);
    }

    getTask(taskID) {
        if (taskID in this.tasks) {
            return this.tasks[taskID];
        }

        throw new Error('invalid taskID: ' + taskID);
    }

    getOptions(options) {
        options = options || {};

        let opts = {
            dryRun: false,
            chipSize: 0.20
        };

        for (let key in opts) {
            if (options.hasOwnProperty(key)) {
                opts[key] = options[key];
            }
        }

        return opts
    }

    updateTaskResults(taskID, results = {}) {
        let task = this.getTask(taskID);
        task.results = results;
        this.tasks[taskID] = task;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    start() {
        throw new Error('abstract method');
    }

    stop(taskID) {
        let task = this.getTask(taskID);
        task.active = false;
        this.tasks[taskID] = task;

        console.log('stopped', 'taskID', taskID);
    }
}