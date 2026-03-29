/**
 * TabHistoryManager
 * Provides independent browser history stacks for each tab navigation.
 * Each tab has its own back/forward history that is preserved when switching tabs.
 */

class TabHistoryManager {
  constructor() {
    this.stacks = {};
    this.currentTab = null;
  }

  /**
   * Initialize or retrieve the history stack for a tab
   */
  getStack(tabName) {
    if (!this.stacks[tabName]) {
      this.stacks[tabName] = {
        history: [],
        index: -1,
      };
    }
    return this.stacks[tabName];
  }

  /**
   * Push a new state into the current tab's history
   */
  push(tabName, pathname) {
    const stack = this.getStack(tabName);
    
    // If we're not at the end of history, truncate (like browser back behavior)
    if (stack.index < stack.history.length - 1) {
      stack.history = stack.history.slice(0, stack.index + 1);
    }

    // Don't add duplicate consecutive entries
    if (stack.history[stack.history.length - 1] !== pathname) {
      stack.history.push(pathname);
      stack.index = stack.history.length - 1;
    }

    this.currentTab = tabName;
  }

  /**
   * Get the previous path in the current tab's history
   */
  getPrevious(tabName) {
    const stack = this.getStack(tabName);
    if (stack.index > 0) {
      return stack.history[stack.index - 1];
    }
    return null;
  }

  /**
   * Navigate back within the tab's history
   */
  back(tabName) {
    const stack = this.getStack(tabName);
    if (stack.index > 0) {
      stack.index--;
      return stack.history[stack.index];
    }
    return null;
  }

  /**
   * Navigate forward within the tab's history
   */
  forward(tabName) {
    const stack = this.getStack(tabName);
    if (stack.index < stack.history.length - 1) {
      stack.index++;
      return stack.history[stack.index];
    }
    return null;
  }

  /**
   * Check if the tab can go back
   */
  canGoBack(tabName) {
    const stack = this.getStack(tabName);
    return stack.index > 0;
  }

  /**
   * Get the current path in the tab
   */
  getCurrent(tabName) {
    const stack = this.getStack(tabName);
    if (stack.index >= 0 && stack.history[stack.index]) {
      return stack.history[stack.index];
    }
    return null;
  }

  /**
   * Clear the history for a tab
   */
  clear(tabName) {
    if (this.stacks[tabName]) {
      this.stacks[tabName] = { history: [], index: -1 };
    }
  }

  /**
   * Clear all tab histories
   */
  clearAll() {
    this.stacks = {};
    this.currentTab = null;
  }

  /**
   * Get the full history for a tab (for debugging)
   */
  getFullHistory(tabName) {
    const stack = this.getStack(tabName);
    return {
      history: stack.history,
      currentIndex: stack.index,
      currentPath: stack.history[stack.index] || null,
    };
  }
}

// Singleton instance
export const tabHistoryManager = new TabHistoryManager();