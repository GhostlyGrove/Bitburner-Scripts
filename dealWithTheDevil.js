/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL");  // Disable all logging to keep the output clean

  const repoUrl = "https://raw.githubusercontent.com/GhostlyGrove/Bitburner-Scripts/main/";

  // List of all initial scripts to download
  const initialScripts = [
    "library.js",
    "killAll",
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
  const tempFile = "dealWithTheDevil_NEW.js";
  const newFileUrl = repoUrl + "dealWithTheDevil.js";
  
  if (await ns.wget(newFileUrl, tempFile)) {
    ns.tprint("New version of dealWithTheDevil.js downloaded successfully.");

    // Read the new script list from the downloaded script
    const scriptContent = ns.read(tempFile);
    ns.tprint(`Content of ${tempFile}: ${scriptContent}`); // Debugging: Print content to check if it's correct

    const newScriptList = extractScriptNames(scriptContent);
    ns.tprint(`Extracted script names: ${newScriptList.join(", ")}`);

    // Determine new scripts that need to be downloaded
    const newScripts = newScriptList.filter(script => !initialScripts.includes(script));
    ns.tprint(`New scripts to be downloaded: ${newScripts.join(", ")}`);

    // Download the new scripts
    if (await downloadScripts(newScripts)) {
      // Only run Daemon.js if all scripts were downloaded successfully
      if (ns.fileExists("Daemon.js")) {
        ns.tprint("Running Daemon.js...");
        ns.exec("Daemon.js", "home", 1);  // Run Daemon.js with 1 thread (adjust threads as necessary)

        // Overwrite dealWithTheDevil.js with the new version
        ns.tprint("Updating dealWithTheDevil.js with the new version...");
        if (ns.write("dealWithTheDevil.js", scriptContent, "w")) {
          ns.tprint("dealWithTheDevil.js updated successfully.");
        } else {
          ns.tprint("ERROR: Failed to update dealWithTheDevil.js.");
        }
      } else {
        ns.tprint("ERROR: Daemon.js not found. Cannot execute.");
      }
    } else {
      ns.tprint("ERROR: Not all new scripts were downloaded successfully. Cannot execute Daemon.js.");
    }
  } else {
    ns.tprint(`ERROR: Failed to download the new version of dealWithTheDevil.js from ${newFileUrl}.`);
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