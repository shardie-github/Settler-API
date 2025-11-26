/**
 * Artillery Processor Functions
 * Helper functions for load testing
 */

module.exports = {
  generateRandomString: () => {
    return Math.random().toString(36).substring(7);
  },
};
