import {Playtech} from "../driver/playtech";

export class ConsoleBot {
    constructor() {
        this.tasks = {};
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

    getTask(taskID) {
        if (taskID in this.tasks) {
            return this.tasks[taskID];
        }

        throw new Error('invalid taskID: ' + taskID);
    }

    getDriver(driverName) {
        if (driverName === 'playtech') {
            return new Playtech();
        }

        throw new Error('driver not found: ' + driverName);
    }

    generateTaskID() {
        return Math.random().toString(36).substr(2, 9);
    }

    updateTaskResults(taskID, results = {}) {
        let task = this.getTask(taskID);
        task.results = results;
        this.tasks[taskID] = task;
    }

    getRunningTime(createTime) {
        let timeDiff = Math.floor(Date.now() / 1000) - createTime;
        return Math.round(timeDiff / 60 / 60).toFixed(1) + ' hours';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}