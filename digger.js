import * as lib from "library.js";
/** @param {NS} ns */
export async function main(ns) {
  let targets = lib.crawlerHackable(ns);  // Grabs list of all hackable servers
  let virusTotal = lib.portViruses(ns);   // Total port openers
  let rootedServers = [];  // List to track rooted servers

  ns.print("Starting server rooting process...");

  while (true) {
    await ns.sleep(100);  // Small sleep to avoid spamming

    //update virusTotal
    virusTotal = lib.portViruses(ns);

    // Update list of rooted servers
    rootedServers = lib.rootedServers(ns);

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];

      if (!ns.hasRootAccess(target) && virusTotal >= ns.getServerNumPortsRequired(target)) {
        lib.superNuke(ns, target);
        ns.toast(target + " has been nuked");
        ns.print(`Nuked ${target}`);
      }
    }

    // Check if all targets are rooted
    if (rootedServers.length === targets.length) {
      ns.toast("Digger has gained access to all Roots");
      ns.print("Digger has gained access to all Roots");
      ns.exit();
    }
  }
}