export class Runtime {
  constructor() {
    this.pending = new Map();
    this.seq = 0;
  }
  async start() {
    const base = new URL("./", document.baseURI).href;
    const slot =
      "mission-mars-v1-" +
      encodeURIComponent(new URL(base).pathname).replaceAll("%", "_");
    // Each open page owns one PGlite connection. Prevent a second writer to the same filesystem.
    if (!navigator.locks)
      throw new Error(
        "Open Mission Mars on localhost or HTTPS in a browser with Web Locks.",
      );
    return new Promise((resolve, reject) => {
      navigator.locks
        .request(slot, { ifAvailable: true }, async (lock) => {
          if (!lock)
            throw new Error(
              "Mission Mars is already open in another tab. Close that tab and reload.",
            );
          this.worker = new Worker(
            new URL("./runtime-worker.js", import.meta.url),
            { type: "module" },
          );
          this.worker.onmessage = ({ data }) => {
            const request = this.pending.get(data.id);
            if (!request) return;
            this.pending.delete(data.id);
            data.error
              ? request.reject(new Error(data.error))
              : request.resolve(data.result);
          };
          this.worker.onerror = (e) => {
            for (const { reject } of this.pending.values())
              reject(
                new Error(e.message || "The flight computer could not load."),
              );
            this.pending.clear();
          };
          try {
            resolve((await this.send("boot", { base, slot })).state);
            await new Promise((done) => {
              this.release = done;
            });
          } finally {
            this.worker.terminate();
          }
        })
        .catch(reject);
    });
  }
  send(action, value = null) {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, action, value });
    });
  }
}
