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

  // List of all scripts to download (initial version)
  const initialScripts = [
    "library.js",
    "killAll.js",
    "trace.js",                   // prints path to target server
    "hack.js",                    // Core hacking script
    "grow.js",                    // Script to grow money on servers
    "weaken.js",                  // Script to reduce server security
    "earlyGameHack.js",           // for when low ram
    "purchasedServerManager.js",  // Manages the purchase and upgrade of servers
    "digger.js",                  // Automatically roots hackable servers
    "dealWithTheDevil.js",        // Script to download and set up everything
    "Goblin.js",                  // early game manager
    "Imp.js",                     // Manages servers, nuking, and preparation scripts
    "Daemon.js"                   // Main controller script
  ];

  // Function to download scripts with retry logic
  async function downloadScripts(scripts) {
    const maxRetries = 3;  // Maximum number of retry attempts for each download
    let allDownloadsSuccessful = true;  // Flag to track if all downloads were successful

    for (const script of scripts) {
      let success = false;  // Flag to track if the current script was downloaded successfully

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          ns.tprint(`Downloading ${script} (Attempt ${attempt}/${maxRetries})...`);
          success = await ns.wget(repoUrl + script, script);  // Attempt to download the script

          if (success) {
            ns.tprint(`${script} downloaded successfully.`);
            break;  // Exit the retry loop if the download was successful
          } else {
            ns.tprint(`ERROR: Failed to download ${script} on attempt ${attempt}.`);
          }
        } catch (error) {
          ns.tprint(`ERROR: Failed to download ${script}. Error: ${error}`);
        }

        if (attempt < maxRetries) {
          await ns.sleep(2000);  // Wait for 2 seconds before retrying
        }
      }

      if (!success) {
        allDownloadsSuccessful = false;  // Set the flag to false if the download ultimately failed
        ns.tprint(`ERROR: Failed to download ${script} after ${maxRetries} attempts.`);
      }
    }

    return allDownloadsSuccessful;
  }

  // Download the new version of dealWithTheDevil.js to get the updated script list
  ns.tprint("Downloading new version of dealWithTheDevil.js...");
  if (await ns.wget(repoUrl + "dealWithTheDevil.js", "dealWithTheDevil_NEW.js")) {
    ns.tprint("New version of dealWithTheDevil.js downloaded successfully.");

    // Read the new script list from the downloaded script
    // This assumes the new version contains only script names, one per line
    const scriptContent = ns.read("dealWithTheDevil_NEW.js");
    const newScriptList = scriptContent.split("\n").map(line => line.trim()).filter(line => line && !line.startsWith("*"));

    // Determine new scripts that need to be downloaded
    const newScripts = newScriptList.filter(script => !initialScripts.includes(script));

    // Download the new scripts
    if (await downloadScripts(newScripts)) {
      // Only run Daemon.js if all scripts were downloaded successfully
      if (ns.fileExists("Daemon.js")) {
        ns.tprint("Running Daemon.js...");
        ns.exec("Daemon.js", "home", 1);  // Run Daemon.js with 1 thread (adjust threads as necessary)
      } else {
        ns.tprint("ERROR: Daemon.js not found. Cannot execute.");
      }
    } else {
      ns.tprint("ERROR: Not all new scripts were downloaded successfully. Cannot execute Daemon.js.");
    }
  } else {
    ns.tprint("ERROR: Failed to download the new version of dealWithTheDevil.js.");
  }
}