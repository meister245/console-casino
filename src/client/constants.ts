export const serverPort = 8080;
export const serverHostname = "localhost";
export const serverUrl = `http://${serverHostname}:${serverPort}`;

export const messageRegexInactive =
  /(disconnected|inactivity|restart|unavailable|table.will.be.closed)/;

export const messageRegexInProgress = /rejoin.+table.+live.round.+finished/;
