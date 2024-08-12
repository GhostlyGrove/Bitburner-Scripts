/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");  // Disable all logging to keep the output clean

  const repoUrl = "https://raw.githubusercontent.com/GhostlyGrove/Bitburner-Scripts/main/";

  // List of all scripts to download
  const allScripts = [
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
          // Ignore the error, and retry
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

  // Download all scripts listed in allScripts
  if (await downloadScripts(allScripts)) {
    // Read the new content of dealWithTheDevil.js to be updated
    const tempFile = "dealWithTheDevil_NEW.js";
    if (await ns.wget(repoUrl + "dealWithTheDevil.js", tempFile)) {
      const scriptContent = ns.read(tempFile);

      // Overwrite dealWithTheDevil.js with the new version
      ns.write("dealWithTheDevil.js", scriptContent, "w");

      // Run Daemon.js if available
      if (ns.fileExists("Daemon.js")) {
        ns.exec("Daemon.js", "home", 1);  // Run Daemon.js with 1 thread (adjust threads as necessary)
      }
    }
  }
}