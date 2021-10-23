// ==UserScript==
// @name        betfairRouletteLauncher
// @include     https://*.betfair.com/*
// @include     https://casino-com-flash.bfcdl.com/live_desktop/*
// ==/UserScript==

// === INSERT LOGIN CREDENTIALS ===

const email = "";
const password = "";
const serverUrl = "http://localhost:8080";

// ===

const runScript = () => {
  const liveCasinoUrlPattern = "https://casino.betfair.com/p/live-casino";
  const lobbyUrlPattern = "https://casino-com-flash.bfcdl.com/live_desktop";

  if (!betfairIsLoggedIn()) {
    console.log("logging into casino");
    betfairLogin();
  } else if (window.location.href.includes(liveCasinoUrlPattern)) {
    console.log("navigating to casino roulette lobby");
    betfairNavigateLobby();
  } else if (window.location.href.includes(lobbyUrlPattern)) {
    console.log("loading console-casino client");
    loadClientScript(`${serverUrl}/client/playtech`);
  }
};

const betfairLogin = () => {
  const loginNameElement = document.querySelector("#ssc-liu");
  const loginPasswordElement = document.querySelector("#ssc-lipw");
  const loginSubmitElement = document.querySelector("#ssc-lis");

  loginNameElement.value = email;
  loginPasswordElement.value = password;

  simulatedClick(loginSubmitElement);
};

const betfairIsLoggedIn = () => {
  return document.querySelector("#ssc-liu") === null;
};

const betfairNavigateLobby = () => {
  const casinoLauncherElement = document.querySelector(
    '[href^="https://launcher.betfair.com/?gameId=live-roulette-cptl"]'
  );

  const lobbyUrl = casinoLauncherElement.href;

  if (lobbyUrl) {
    window.location.href = lobbyUrl;
  }
};

const loadClientScript = (url) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const headElement = document.getElementsByTagName("head")[0];

    script.onload = resolve;
    script.onerror = reject;
    script.src = url;

    headElement.appendChild(script);
  });
};

const simulatedClick = (target) => {
  const event = target.ownerDocument.createEvent("MouseEvents");
  const opts = {
    type: "click",
    canBubble: true,
    cancelable: true,
    view: target.ownerDocument.defaultView,
    detail: 1,
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: 0,
    relatedTarget: null,
  };

  event.initMouseEvent(
    opts.type,
    opts.canBubble,
    opts.cancelable,
    opts.view,
    opts.detail,
    opts.screenX,
    opts.screenY,
    opts.clientX,
    opts.clientY,
    opts.ctrlKey,
    opts.altKey,
    opts.shiftKey,
    opts.metaKey,
    opts.button,
    opts.relatedTarget
  );

  target.dispatchEvent(event);
};

runScript()
