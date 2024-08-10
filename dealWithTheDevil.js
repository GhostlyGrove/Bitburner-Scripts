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

  // List of all scripts to download
  const scripts = [
    "library.js",
    "hack.js",               // Core hacking script
    "grow.js",               // Script to grow money on servers
    "weaken.js",             // Script to reduce server security
    "purchasedServerManager.js",  // Manages the purchase and upgrade of servers
    "digger.js",             // Automatically roots hackable servers
    "dealWithTheDevil.js",   // Script to download and set up everything
    "Imp.js",                // Manages servers, nuking, and preparation scripts
    "Daemon.js"              // Main controller script
  ];

  const maxRetries = 3;  // Maximum number of retry attempts for each download
  let allDownloadsSuccessful = true;  // Flag to track if all downloads were successful

  // Download all the scripts
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

  // Only run Daemon.js if all scripts were downloaded successfully
  if (allDownloadsSuccessful && ns.fileExists("Daemon.js")) {
    ns.tprint("Running Daemon.js...");
    ns.exec("Daemon.js", "home", 1);  // Run Daemon.js with 1 thread (adjust threads as necessary)
  } else if (!allDownloadsSuccessful) {
    ns.tprint("ERROR: Not all scripts were downloaded successfully. Cannot execute Daemon.js.");
  } else {
    ns.tprint("ERROR: Daemon.js not found. Cannot execute.");
  }
}