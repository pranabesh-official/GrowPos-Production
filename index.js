const { app, BrowserWindow } = require("electron");
const path = require("path");
const net = require("net");
const join = path.join;
const spawn = require("child_process").spawn;
const shell = require("shelljs");
const http = require("http");
const express = require("express");
const userInterface = express();
const fs = require("fs");
const isDev = require("electron-is-dev");
const { autoUpdater } = require("electron-updater");
// const NativeImage = require('electron').nativeImage;
// require('dotenv').config()

const logTag = "[NOSQLCLIENT]";
let mongoProcess, nodeProcess;
let startNodeServer = 0;

autoUpdater.on("update-not-available", (info) => {
  console.log(info);
});

autoUpdater.on("update-available", (info) => {
  console.log(info);
});

autoUpdater.on("download-progress", (progressObj) => {
  console.log(info);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log(info);
});

const createWindow = function () {
  console.log(logTag, "trying to start Nosqlclient electron application");
  let dbRoot;
  const appRoot = path.resolve(__dirname);
  if (isDev) {
    dbRoot = path.resolve(__dirname, "./extraResources/");
  } else {
    dbRoot = path.resolve(__dirname, "../extraResources/");
  }
  const loadingPage = join("file://", appRoot, "./loading/loading.html");
  // const checkInternetConnected = require('check-internet-connected');
  require("dns").resolve("www.google.com", function (err) {
    if (err) {
      console.log("No connection");
    } else {
      console.log("Internet-Connected");
    }
  });

  console.log(
    logTag,
    "trying to show loading page while everything is getting ready, loading page url: " +
      loadingPage
  );
  // show loading
  let win = new BrowserWindow({
    width: 200,
    height: 200,
    minWidth: 200,
    minHeight: 200,
    maxWidth: 200,
    maxHeight: 200,
    icon: path.join(__dirname, "./assets/favicon.ico"),
    show: false,
    frame: false,
    transparent: true,
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
    },
  });
  win.loadURL(loadingPage);
  win.webContents.once("dom-ready", () => {
    win.show();
  });
  //fix tunnel-ssh
  shell.cp(
    "-R",
    join(appRoot, "app", "/programs/server/npm/node_modules/tunnel-ssh"),
    join(
      appRoot,
      "app",
      "programs/server/npm/node_modules/meteor/modules-runtime/node_modules/"
    )
  );

  beginStartingMongo(appRoot, win, dbRoot);
};

const beginStartingMongo = function (appRoot, loadingWin, dbRoot) {
  console.log(logTag, "trying to start mongod process");
  let path = join(dbRoot, "bin", "mongod");
  if (process.platform === "win32") {
    path += ".exe";
  }
  console.log(logTag, "detected mongod executable path: " + path);

  let dataDir;
  let lockfile;

  if (process.platform === "win32") {
    dataDir = process.env.APPDATA;
  } else if (process.platform === "darwin") {
    dataDir = join(process.env.HOME, "Library", "Preferences");
  } else if (process.platform === "linux") {
    dataDir = join(process.env.HOME, "var", "local");
  }
  dataDir = join(dataDir, "Mongoclient", "db");
  lockfile = join(dataDir, "mongod.lock");
  console.log(logTag, "detected mongod data directory: " + dataDir);

  console.log(
    logTag,
    "trying to create data dir and removing mongod.lock just in case"
  );
  shell.mkdir("-p", dataDir);
  shell.rm("-f", lockfile);

  freeport(null, function (port) {
    console.log(logTag, "trying to spawn mongod process with port: " + port);
    mongoProcess = spawn(path, [
      "--dbpath",
      dataDir,
      "--port",
      port,
      "--bind_ip",
      "127.0.0.1",
    ]);

    mongoProcess.stdout.on("data", function (data) {
      console.log(logTag, "[MONGOD-STDOUT]", startNodeServer);
      // startNode(appRoot, port, loadingWin);

      if (startNodeServer === 0) {
        startNode(appRoot, port, loadingWin);
      } else {
        startNodeServer = startNodeServer + 1;
      }
    });

    mongoProcess.stderr.on("data", function (data) {
      console.error(logTag, "[MONGOD-STDERR]", data.toString());
    });

    mongoProcess.on("exit", function (code) {
      console.log(logTag, "[MONGOD-EXIT]", code.toString());
    });
  });
};

const startNode = function (appRoot, mongoPort, loadingWin) {
  console.log(logTag, "trying to start node process to port", mongoPort);
  startNodeServer = startNodeServer + 1;
  freeport(null, function (port) {
    console.log(logTag, "trying to spawn node process with port: " + port);
    const AuthServer = require("./AuthServer/index.js");
    const TortoiseDB = require("./tortoiseDB/tortoiseDB");
    db = new AuthServer({
      name: "ShopDB",
      port: 4545,
      mongoURI: `mongodb://localhost:${mongoPort}`,
      batchLimit: 1000,
    });
    db.start();
    db = new TortoiseDB({
      name: "ShopDB",
      port: 4040,
      mongoURI: `mongodb://localhost:${mongoPort}`,
      batchLimit: 1000,
    });
    db.start();
    waitUntilMeteorGetsReady(port, loadingWin, appRoot);
  });
};

const waitUntilMeteorGetsReady = function (port, loadingWin) {
  let fired = false;
  http
    .get("http://localhost:4545/", function () {
      if (!fired) {
        fired = true;
        loadWindow(port, loadingWin);
      }
    })
    .on("error", function (/* err */) {
      if (fired) return;
      setTimeout(function () {
        waitUntilMeteorGetsReady(port, loadingWin);
      }, 30);
    });
};
const freeport = function (start, done) {
  console.log(logTag, "trying to find free port for spawn");
  start = start || 27017;
  const socket = new net.Socket()
    .once("connect", function () {
      socket.destroy();
      freeport(++start, done);
    })
    .once("error", function (/* err */) {
      socket.destroy();
      done(start);
    })
    .connect(start, "127.0.0.1");
};

const loadWindow = function (appPort, loadingWin, appRoot) {
  const PUBLIC_PATH = path.resolve(__dirname, "app");
  const PORT = parseInt(process.env.PORT || "4141", 10);
  const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
  const indexHtml = path.join(PUBLIC_PATH, "index.html");
  const indexHtmlContent = fs
    .readFileSync(indexHtml, "utf-8")
    .replace(/__PUBLIC_URL_PLACEHOLDER__/g, PUBLIC_URL);

  userInterface.get("/", (req, res) => {
    res.send(indexHtmlContent);
  });
  userInterface.use(express.static(path.join(PUBLIC_PATH)));
  userInterface.listen(PORT);
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 1000,
    minHeight: 680,
    show: false,
    frame: false,
    icon: path.join(__dirname, "./assets/favicon.ico"),
    titleBarStyle: "hidden",
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false,
    },
  });

  // window.loadURL(`file://${path.join(__dirname, './app/index.html')}`);
  window.loadURL(`http://localhost:${4141}/`);

  window.webContents.once("dom-ready", () => {
    console.log("main loaded");
    loadingWin.close();
    window.show();
  });
};

app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});
// app.on('ready', createWindow);
app.on("ready", async () => {
  let main = null;
  createWindow(main);
});
app.on("window-all-closed", function () {
  app.quit();
});
app.on("will-quit", function () {
  nodeProcess.kill();
  mongoProcess.kill();
});
