/** @param {NS} ns **/
async function main(ns) {
  ns.disableLog("ALL");

  const repoUrl = "https://raw.githubusercontent.com/GhostlyGrove/Bitburner-Scripts/main/";

  // Download the new version of dealWithTheDevil.js first
  const tempFile = "dealWithTheDevil_NEW.js";
  ns.tprint("Downloading new version of dealWithTheDevil.js...");
  if (await ns.wget(repoUrl + "dealWithTheDevil.js", tempFile)) {
    ns.tprint("New version of dealWithTheDevil.js downloaded successfully.");

    // Read the new script content
    const scriptContent = ns.read(tempFile);

    // Overwrite dealWithTheDevil.js with the new version
    ns.tprint("Updating dealWithTheDevil.js with the new version...");
    try {
      ns.write("dealWithTheDevil.js", scriptContent, "w");
      ns.tprint("dealWithTheDevil.js updated successfully.");
    } catch (error) {
      ns.tprint("ERROR: Failed to write content to dealWithTheDevil.js. " + error);
      return; // Exit if update fails
    }
  } else {
    ns.tprint("ERROR: Failed to download the new version of dealWithTheDevil.js.");
    return; // Exit if download fails
  }

  // Define the list of scripts within the new dealWithTheDevil.js content
  const allScripts = [
    "library.js",
    "killAll",
    "getPservRam.js",
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

  async function downloadScripts(scripts) {
    const maxRetries = 3;                                             // Maximum number of retry attempts for each download
    let allDownloadsSuccessful = true;                                // Flag to track if all downloads were successful

    for (const script of scripts) {
      let success = false;                                            // Flag to track if the current script was downloaded successfully

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          ns.tprint(`Downloading ${script} (Attempt ${attempt}/${maxRetries})...`);
          success = await ns.wget(repoUrl + script, script);           // Attempt to download the script

          if (success) {
            ns.tprint(`${script} downloaded successfully.`);
            await ns.sleep(500);
            break;                                                     // Exit the retry loop if the download was successful
          } else {
            ns.tprint(`ERROR: Failed to download ${script} on attempt ${attempt}.`);
            await ns.sleep(500);
          }
        } catch (error) {
          ns.tprint(`ERROR: Failed to download ${script}. Error: ${error}`);
        }

        if (attempt < maxRetries) {
          await ns.sleep(2000);                                          // Wait for 2 seconds before retrying
        }
      }

      if (!success) {
        allDownloadsSuccessful = false;                                 // Set the flag to false if the download ultimately failed
        ns.tprint(`ERROR: Failed to download ${script} after ${maxRetries} attempts.`);
      }
    }

    return allDownloadsSuccessful;
  }

  // Download all scripts listed in allScripts from the updated version
  ns.tprint("Downloading scripts...");
  if (await downloadScripts(allScripts)) {
    ns.tprint("All scripts downloaded successfully.");

    // Run Daemon.js if available
    if (ns.fileExists("Daemon.js")) {
      ns.tprint("Running Daemon.js...");
      ns.exec("Daemon.js", "home", 1);                                      // Run Daemon.js with 1 thread (adjust threads as necessary)
    } else {
      ns.tprint("ERROR: Daemon.js not found. Cannot execute.");
    }

    // Suggest setting an alias for dealWithTheDevil.js
    ns.tprint("");
    ns.tprint("=============================================================");
    ns.tprint("Consider setting an alias for 'dealWithTheDevil.js'");
    ns.tprint("This will allow for easier autocomplete in the terminal");
    ns.tprint("Copy and paste the following line into the terminal:");
    ns.tprint("alias Take_the_Deal=\"run dealWithTheDevil.js\"");
    ns.tprint("Then, you can run the script with the command: Take_the_Deal");
    ns.tprint("=============================================================");
    ns.tprint("");

  } else {
    ns.tprint("ERROR: Not all scripts were downloaded successfully.");
  }
}