window.plugins = {
  delay: async function(timeout) {
    return new Promise(function(resolve) {
      setTimeout(() => resolve(), timeout);
    });
  }
};