export const invoke = (cmd: string) => {
  switch (cmd) {
    case "get_os_info":
      return Promise.resolve("TestOS x86_64");
    case "get_disk_space":
      return Promise.resolve([200 * 1024 * 1024 * 1024, 500 * 1024 * 1024 * 1024]);
    case "get_memory_info":
      return Promise.resolve([8 * 1024 * 1024 * 1024, 16 * 1024 * 1024 * 1024]);
    case "check_network_status":
      return Promise.resolve(true);
    default:
      return Promise.resolve(null);
  }
};
