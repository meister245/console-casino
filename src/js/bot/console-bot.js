export class ConsoleBot {
    constructor() {
        this.tasks = {};
    }

    runTask() {
        throw new Error('abstract method');
    }

    isActiveTask(taskID) {
        return this.getTask(taskID).active;
    }

    stopTask(taskID) {
        let task = this.getTask(taskID);
        task.active = false;
        this.updateTask(taskID, task);

        console.log('stopped taskID:' + taskID);
    }

    getDriver() {
        throw new Error('abstract method');
    }

    getTask(taskID) {
        return this.tasks[taskID];
    }

    getTasks() {
        return this.tasks;
    }

    generateTaskID() {
        return Math.random().toString(36).substr(2, 9);
    }

    updateTask(taskID, data) {
        this.tasks[taskID] = data;
    }

    getRunningTime(createTime) {
        let timeDiff = Math.floor(Date.now() / 1000) - createTime;
        return Math.round(timeDiff / 60 / 60).toFixed(1) + ' hours';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}