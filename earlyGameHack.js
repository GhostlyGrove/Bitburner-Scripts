/** 
 * @param {NS} ns 
 * Self-contained basic looping script with weaken, grow, and hack logic.
 */

export async function main(ns) {
  // Set your target server
  const target = ns.args[0]; // Change this to your desired target

  // Set thresholds
  const securityThreshold = ns.getServerMinSecurityLevel(target) + 2;
  const moneyThreshold = ns.getServerMaxMoney(target) * 0.9;

  // Loop indefinitely
  while (true) {
    const currentSecurity = ns.getServerSecurityLevel(target);
    const currentMoney = ns.getServerMoneyAvailable(target);

    // Check if we need to weaken the server
    if (currentSecurity > securityThreshold) {
      // Calculate the optimal number of threads for weaken
      const weakenTime = ns.getWeakenTime(target);
      const availableThreads = Math.floor((weakenTime / ns.getHackTime(target)) * ns.getPlayer().hackingThreads);

      // Weaken with the calculated number of threads
      await ns.weaken(target, { threads: availableThreads });
    }
    // Check if we need to grow the server's money
    else if (currentMoney < moneyThreshold) {
      // Calculate the optimal number of threads for grow
      const growTime = ns.getGrowTime(target);
      const availableThreads = Math.floor((growTime / ns.getHackTime(target)) * ns.getPlayer().hackingThreads);

      // Grow with the calculated number of threads
      await ns.grow(target, { threads: availableThreads });
    }
    // Otherwise, hack the server
    else {
      // Calculate the optimal number of threads for hack
      const hackTime = ns.getHackTime(target);
      const availableThreads = Math.floor(ns.getPlayer().hackingThreads);

      // Hack with the calculated number of threads
      await ns.hack(target, { threads: availableThreads });
    }
  }
}