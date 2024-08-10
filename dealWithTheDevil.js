/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");

  const repoUrl = "https://raw.githubusercontent.com/GhostlyGrove/Bitburner-Scripts/main/";

  const scripts = [
    "library.js",
    "hack.js",                               // kill your scripts
    "grow.js",                               // go home
    "weaken.js",                             // take the deal
    "purchasedServerManager.js",
    "digger.js",
    "dealWithTheDevil.js",
    "Imp.js",
    "Daemon.js"
  ];

  // Download all the scripts
  for (const script of scripts) {
    try {
      ns.tprint(`Downloading ${script}...`);
      await ns.wget(repoUrl + script, script);
      ns.tprint(`${script} downloaded successfully.`);
    } catch (error) {
      ns.tprint(`ERROR: Failed to download ${script}. Error: ${error}`);
    }
  }

  // Run Daemon.js after all scripts are downloaded
  if (ns.fileExists("Daemon.js")) {
    ns.tprint("Running Daemon.js...");
    ns.exec("Daemon.js", "home");
  } else {
    ns.tprint("ERROR: Daemon.js not found. Cannot execute.");
  }
}