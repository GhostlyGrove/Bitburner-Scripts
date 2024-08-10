/** @param {NS} ns */
export async function main(ns) {
  await ns.weaken(ns.args[0]);
  await ns.sleep(Math.random() * 7500 + 3725);
}