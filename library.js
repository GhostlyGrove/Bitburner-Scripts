/** @param {NS} ns */
export function crawlerHackable(ns) {    //returns an array of all hackable servers
  let startingList = ns.scan("home");
  let serverList = [];

  for (let i = 0; i < startingList.length; i++) {  //removes purchased servers from startingList
    if (!startingList[i].includes("pserv")) {
      serverList.push(startingList[i]);
    }
  }

  for (let i = 0; i < serverList.length; i++) {  //scans through serverList
    let currentFocus = serverList[i];
    let lookingAt = ns.scan(currentFocus);

    for (let j = 0; j < lookingAt.length; j++) {  //if lookingAt is unique add to serverList
      if (!serverList.includes(lookingAt[j]) && !lookingAt[j].includes("pserv") && lookingAt[j] != "home") {
        serverList.push(lookingAt[j]);
      }
    }
  }
  return serverList;
}

export function crawler(ns) {          //returns an array of all servers
  let serverList = ns.scan("home");

  for (let i = 0; i < serverList.length; i++) {  //scans through serverList
    let currentFocus = serverList[i];
    let lookingAt = ns.scan(currentFocus);

    for (let j = 0; j < lookingAt.length; j++) {  //if lookingAt is unique add to serverList
      if (!serverList.includes(lookingAt[j])) {
        serverList.push(lookingAt[j]);
      }
    }
  }
  return serverList;
}

export function superNuke(ns, target) {    //nukes the shit out of the target
  //needs portViruses also imported to work

  if (ns.fileExists("BruteSSH.exe", "home")) {
    ns.brutessh(target);
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    ns.ftpcrack(target);
  }
  if (ns.fileExists("relaySMTP.exe", "home")) {
    ns.relaysmtp(target);
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    ns.httpworm(target);
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    ns.sqlinject(target);
  }
  if (portViruses(ns) >= ns.getServerNumPortsRequired(target)) {
    ns.nuke(target);
  }
}

export function portViruses(ns) {    // returns total number of port opening program
  let total = 0;

  if (ns.fileExists("BruteSSH.exe", "home")) {
    total++
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    total++
  }
  if (ns.fileExists("relaySMTP.exe", "home")) {
    total++
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    total++
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    total++
  }
  return total;
}

export function rootedServers(ns) {     // returns an array of all servers with root access
  let targets = crawlerHackable(ns);    //needs crawlerHackable also imported to work
  let rootedServers = [];
  let notRootedServers = [];

  for (let i = 0; i < targets.length; i++) {
    if (ns.hasRootAccess(targets[i])) {
      rootedServers.push(targets[i]);
    }
    else if (!ns.hasRootAccess(targets[i])) {
      notRootedServers.push(targets[i]);
    }
  }
  return rootedServers;
}

export function findBestTargets(ns) {
  const hackableServers = rootedServers(ns);  // Use the rootedServers function to get a list of hackable servers
  const player = ns.getPlayer();  // Get player stats
  let bestTargets = [];

  for (const server of hackableServers) {
    const serverInfo = ns.getServer(server);
    const maxMoney = ns.getServerMaxMoney(server);  // Maximum money on the server
    const minSecurity = ns.getServerMinSecurityLevel(server);  // Minimum security level

    // Temporarily set the server's security level to its minimum for accurate hack chance calculation
    const originalSecurityLevel = serverInfo.hackDifficulty;
    serverInfo.hackDifficulty = minSecurity;
    const hackChanceAtMinSecurity = ns.formulas.hacking.hackChance(serverInfo, player);  // Chance of a successful hack at minimum security
    serverInfo.hackDifficulty = originalSecurityLevel;  // Restore the original security level

    const weakenTime = ns.formulas.hacking.weakenTime(serverInfo, player);  // Time required to weaken the server to its minimum security level

    // Calculate the weight metric
    const weight = (maxMoney / weakenTime) * hackChanceAtMinSecurity;

    bestTargets.push({ server, weight });
  }

  // Sort the targets by weight in descending order
  bestTargets.sort((a, b) => b.weight - a.weight);

  // Return an array of the top 10 best server names
  return bestTargets.slice(0, 10).map(target => target.server);
}