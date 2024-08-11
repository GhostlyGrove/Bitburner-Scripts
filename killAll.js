import { crawler } from "library"
/** @param {NS} ns */
export async function main(ns) {
  let servers = crawler(ns);

  for (let i = 0; i < servers.length; i++) {
    ns.killall(servers[i]);
  }
}