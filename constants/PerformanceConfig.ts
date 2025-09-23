// Global Performance Configuration
export const PERFORMANCE_CONFIG = {
  // Touch response settings for instant feedback
  TOUCH: {
    ACTIVE_OPACITY: 0.3,
    DELAY_PRESS_IN: 0,
    DELAY_PRESS_OUT: 0,
    DELAY_LONG_PRESS: 100,
  },

  // Animation settings for smooth performance
  ANIMATION: {
    DURATION_FAST: 150,
    DURATION_NORMAL: 250,
    DURATION_SLOW: 400,
    EASING: 'ease-out',
  },

  // FlatList optimization settings
  FLATLIST: {
    REMOVE_CLIPPED_SUBVIEWS: true,
    MAX_TO_RENDER_PER_BATCH: 10,
    WINDOW_SIZE: 10,
    INITIAL_NUM_TO_RENDER: 15,
    UPDATE_CELLS_BATCHING_PERIOD: 50,
    GET_ITEM_LAYOUT: undefined,
    DISABLE_VIRTUALIZATION: false,
  },

  // Modal settings for instant appearance
  MODAL: {
    ANIMATION_TYPE: 'none' as const,
    STATUS_BAR_TRANSLUCENT: true,
    HARDWARE_ACCELERATED: true,
  },

  // TextInput settings for responsive typing
  TEXT_INPUT: {
    AUTO_CORRECT: false,
    AUTO_CAPITALIZE: 'none' as const,
    SPELL_CHECK: false,
    KEYBOARD_APPEARANCE: 'dark' as const,
  },

  // Image settings for fast loading
  IMAGE: {
    RESIZE_MODE: 'cover' as const,
    CACHE: 'memory',
    FADE_DURATION: 0,
  },

  // Network settings for quick requests
  NETWORK: {
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 100,
  }
};

// Pre-computed style objects for reuse
export const FAST_STYLES = {
  touchableButton: {
    activeOpacity: PERFORMANCE_CONFIG.TOUCH.ACTIVE_OPACITY,
    delayPressIn: PERFORMANCE_CONFIG.TOUCH.DELAY_PRESS_IN,
    delayPressOut: PERFORMANCE_CONFIG.TOUCH.DELAY_PRESS_OUT,
  },

  fastModal: {
    animationType: PERFORMANCE_CONFIG.MODAL.ANIMATION_TYPE,
    statusBarTranslucent: PERFORMANCE_CONFIG.MODAL.STATUS_BAR_TRANSLUCENT,
    hardwareAccelerated: PERFORMANCE_CONFIG.MODAL.HARDWARE_ACCELERATED,
  },

  optimizedFlatList: {
    removeClippedSubviews: PERFORMANCE_CONFIG.FLATLIST.REMOVE_CLIPPED_SUBVIEWS,
    maxToRenderPerBatch: PERFORMANCE_CONFIG.FLATLIST.MAX_TO_RENDER_PER_BATCH,
    windowSize: PERFORMANCE_CONFIG.FLATLIST.WINDOW_SIZE,
    initialNumToRender: PERFORMANCE_CONFIG.FLATLIST.INITIAL_NUM_TO_RENDER,
    updateCellsBatchingPeriod: PERFORMANCE_CONFIG.FLATLIST.UPDATE_CELLS_BATCHING_PERIOD,
    getItemLayout: PERFORMANCE_CONFIG.FLATLIST.GET_ITEM_LAYOUT,
    disableVirtualization: PERFORMANCE_CONFIG.FLATLIST.DISABLE_VIRTUALIZATION,
  },

  responsiveTextInput: {
    autoCorrect: PERFORMANCE_CONFIG.TEXT_INPUT.AUTO_CORRECT,
    autoCapitalize: PERFORMANCE_CONFIG.TEXT_INPUT.AUTO_CAPITALIZE,
    spellCheck: PERFORMANCE_CONFIG.TEXT_INPUT.SPELL_CHECK,
    keyboardAppearance: PERFORMANCE_CONFIG.TEXT_INPUT.KEYBOARD_APPEARANCE,
  },

  fastImage: {
    resizeMode: PERFORMANCE_CONFIG.IMAGE.RESIZE_MODE,
    fadeDuration: PERFORMANCE_CONFIG.IMAGE.FADE_DURATION,
  }
};

// Utility functions for performance optimization
export const PerformanceUtils = {
  // Debounce function for preventing rapid successive calls
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number = 100
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for limiting execution frequency
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number = 100
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Immediate feedback function for button presses
  immediateCallback: (callback: () => void) => {
    // Execute immediately
    callback();
  },

  // Batch updates for multiple state changes
  batchUpdate: (updates: (() => void)[]) => {
    updates.forEach(update => update());
  }
};

// Performance monitoring utilities
export const PerformanceMonitor = {
  // Log timing for debugging
  timeFunction: <T extends (...args: any[]) => any>(
    func: T,
    name: string = 'Function'
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();
      console.log(`${name} execution time: ${end - start}ms`);
      return result;
    }) as T;
  },

  // Memory usage monitoring
  logMemoryUsage: () => {
    if (__DEV__) {
      console.log('Memory usage monitoring enabled in development');
    }
  }
};

export default PERFORMANCE_CONFIG;
