/**
 * kill all scripts before running
 * go home
 * run the script
 * automatically starts stuff that needs to start
 * afterwards if you need to restart daemon or imp just kill the daemon or imp script you have running first
 */

/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");  // Disable all logging to keep the output clean

  const repoUrl = "https://raw.githubusercontent.com/GhostlyGrove/Bitburner-Scripts/main/";

  // List of all initial scripts to download
  const initialScripts = [
    "library.js",
    "killAll",
    "trace.js",
    "hack.js",
    "grow.js",
    "weaken.js",
    "earlyGameHack.js",
    "purchasedServerManager.js",
    "digger.js",
    "dealWithTheDevil.js",
    "Goblin.js",
    "Imp.js",
    "Daemon.js"
  ];

  async function downloadScripts(scripts) {
    const maxRetries = 3;  // Maximum number of retry attempts for each download
    let allDownloadsSuccessful = true;  // Flag to track if all downloads were successful

    for (const script of scripts) {
      let success = false;  // Flag to track if the current script was downloaded successfully

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          success = await ns.wget(repoUrl + script, script);  // Attempt to download the script

          if (success) {
            break;  // Exit the retry loop if the download was successful
          }
        } catch (error) {
          // Handle the error quietly, as logging is disabled
        }

        if (attempt < maxRetries) {
          await ns.sleep(2000);  // Wait for 2 seconds before retrying
        }
      }

      if (!success) {
        allDownloadsSuccessful = false;  // Set the flag to false if the download ultimately failed
      }
    }

    return allDownloadsSuccessful;
  }

  // Download the new version of dealWithTheDevil.js to get the updated script list
  if (await ns.wget(repoUrl + "dealWithTheDevil.js", "dealWithTheDevil_NEW.js")) {
    // Read the new script list from the downloaded script
    const scriptContent = ns.read("dealWithTheDevil_NEW.js");
    const newScriptList = extractScriptNames(scriptContent);

    // Determine new scripts that need to be downloaded
    const newScripts = newScriptList.filter(script => !initialScripts.includes(script) || !ns.fileExists(script));

    // Download the new scripts
    if (await downloadScripts(newScripts)) {
      // Only run Daemon.js if all scripts were downloaded successfully
      if (ns.fileExists("Daemon.js")) {
        ns.exec("Daemon.js", "home", 1);  // Run Daemon.js with 1 thread (adjust threads as necessary)
      }
    }
  }
}

// Function to extract script names from the new version of dealWithTheDevil.js
function extractScriptNames(scriptContent) {
  const scriptLines = scriptContent.split("\n");
  const scriptNames = [];

  for (const line of scriptLines) {
    const trimmedLine = line.trim();
    // Match only lines that start with a quote and end with a comma, containing .js
    if (trimmedLine.startsWith('"') && trimmedLine.endsWith('",') && trimmedLine.includes(".js")) {
      const scriptName = trimmedLine.slice(1, -2);  // Remove surrounding quotes and comma
      scriptNames.push(scriptName);
    }
  }

  return scriptNames;
}