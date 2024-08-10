/** 
 * Returns a list of all hackable servers, excluding purchased servers.
 * Starts from the home server and scans recursively to find hackable servers.
 */
export function crawlerHackable(ns) {

  let startingList = ns.scan("home"); // Get the list of servers directly connected to "home"
  let serverList = [];

  for (let i = 0; i < startingList.length; i++) {
    // If the server is not a purchased server, add it to serverList
    if (!startingList[i].includes("pserv")) {
      serverList.push(startingList[i]);
    }
  }

  for (let i = 0; i < serverList.length; i++) {
    let currentFocus = serverList[i];   // The server we're currently looking at
    let lookingAt = ns.scan(currentFocus); // Get the servers connected to currentFocus

    for (let j = 0; j < lookingAt.length; j++) {
      // If the connected server is not already in serverList and is not "home" or a purchased server, add it to the list
      if (!serverList.includes(lookingAt[j]) && !lookingAt[j].includes("pserv") && lookingAt[j] != "home") {
        serverList.push(lookingAt[j]);
      }
    }
  }

  return serverList; // Return the final list of hackable servers
}

/** 
 * Returns a list of all servers in the game by scanning recursively from the home server.
 */
export function crawler(ns) {

  let serverList = ns.scan("home"); // Start with the servers connected to "home"

  for (let i = 0; i < serverList.length; i++) {
    let currentFocus = serverList[i];  // The server we're currently looking at
    let lookingAt = ns.scan(currentFocus); // Get the servers connected to currentFocus

    for (let j = 0; j < lookingAt.length; j++) {
      // If the connected server is not already in serverList, add it to the list
      if (!serverList.includes(lookingAt[j])) {
        serverList.push(lookingAt[j]);
      }
    }
  }

  return serverList; // Return the final list of all servers
}

/** 
 * Attempts to gain root access to a target server using available port-opening programs.
 * Requires portViruses function to count the number of port-opening programs.
 */
export function superNuke(ns, target) {

  if (ns.fileExists("BruteSSH.exe", "home")) {
    ns.brutessh(target); // Use BruteSSH to open an SSH port
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    ns.ftpcrack(target); // Use FTPCrack to open an FTP port
  }
  if (ns.fileExists("relaySMTP.exe", "home")) {
    ns.relaysmtp(target); // Use relaySMTP to open an SMTP port
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    ns.httpworm(target); // Use HTTPWorm to open an HTTP port
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    ns.sqlinject(target); // Use SQLInject to open an SQL port
  }

  // If the number of open ports is enough to gain root access, nuke the server
  if (portViruses(ns) >= ns.getServerNumPortsRequired(target)) {
    ns.nuke(target);
  }
}

/** 
 * Returns the total number of port-opening programs available on the home server.
 */
export function portViruses(ns) {

  let total = 0;

  if (ns.fileExists("BruteSSH.exe", "home")) {
    total++; // Increment total for each program found
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    total++;
  }
  if (ns.fileExists("relaySMTP.exe", "home")) {
    total++;
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    total++;
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    total++;
  }

  return total; // Return the total number of port-opening programs
}

/** 
 * Returns a list of all servers that have root access based on the list of hackable servers.
 * Requires crawlerHacker function to get a list of hackable servers.
 */
export function rootedServers(ns) {

  let targets = crawlerHackable(ns); // Get the list of hackable servers
  let rootedServers = [];

  for (let i = 0; i < targets.length; i++) {
    // If you have root access to the server, add it to the rootedServers list
    if (ns.hasRootAccess(targets[i])) {
      rootedServers.push(targets[i]);
    }
  }

  return rootedServers; // Return the final list of rooted servers
}

/** 
 * Finds and ranks the best servers to hack based on their potential profit and security level.
 * Returns the top 10 servers to hack.
 */
export function findBestTargets(ns) {

  const hackableServers = rootedServers(ns); // Get the list of servers you have root access to
  const player = ns.getPlayer(); // Get the player's hacking stats
  let bestTargets = [];

  for (const server of hackableServers) {
    const serverInfo = ns.getServer(server);
    const maxMoney = ns.getServerMaxMoney(server); // Maximum money available on the server
    const minSecurity = ns.getServerMinSecurityLevel(server); // Minimum possible security level

    // Temporarily set the server's security level to its minimum for accurate hack chance calculation
    const originalSecurityLevel = serverInfo.hackDifficulty;
    serverInfo.hackDifficulty = minSecurity;
    const hackChanceAtMinSecurity = ns.formulas.hacking.hackChance(serverInfo, player); // Chance of successfully hacking at minimum security
    serverInfo.hackDifficulty = originalSecurityLevel; // Restore the server's original security level

    const weakenTime = ns.formulas.hacking.weakenTime(serverInfo, player); // Time required to weaken the server to its minimum security level

    // Calculate a weight to rank servers by their profit potential
    const weight = (maxMoney / weakenTime) * hackChanceAtMinSecurity;

    bestTargets.push({ server, weight });
  }

  // Sort the servers by their calculated weight, with the highest weight first
  bestTargets.sort((a, b) => b.weight - a.weight);

  // Return the top 10 best servers to hack
  return bestTargets.slice(0, 10).map(target => target.server);
}