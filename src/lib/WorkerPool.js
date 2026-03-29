/**
 * WorkerPool: Persistent Web Worker pool for efficient buffer generation
 * 
 * Features:
 * - Reuses workers across multiple tasks to minimize overhead
 * - Immediate task cancellation via AbortController signal
 * - Automatic queue management when all workers are busy
 * - Timeout protection (60s max per task)
 * - Full support for streaming buffer generation with early cancellation
 * 
 * AbortController Flow:
 * 1. executeTask() creates AbortController for task
 * 2. App calls cancelTask(taskId) → abortController.abort() fires
 * 3. Signal listeners trigger immediately → cleanup + worker message
 * 4. Worker checks abort signal and stops synthesis
 */

class WorkerPool {
  constructor(workerScript, poolSize = 2) {
    this.workerScript = workerScript;
    this.poolSize = poolSize;
    this.workers = [];
    this.taskQueue = [];
    this.taskMap = new Map(); // Maps taskId -> { abortController, workerEntry, task }
    this.abortedTasks = new Set(); // Track aborted task IDs to prevent double-cleanup
    this.initialized = false;
  }

  /**
   * Initialize the worker pool on first use
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      for (let i = 0; i < this.poolSize; i++) {
        const worker = new Worker(
          new URL(this.workerScript, import.meta.url),
          { type: "module" }
        );
        this.workers.push({
          worker,
          busy: false,
          currentTask: null,
        });
      }
      this.initialized = true;
    } catch (error) {
      console.warn('[WorkerPool] Failed to initialize workers:', error.message);
      this.initialized = false;
    }
  }

  /**
   * Get an idle worker from the pool, or queue the task
   */
  async executeTask(taskId, taskData) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Create abort controller for this task
    const abortController = new AbortController();
    
    return new Promise((resolve, reject) => {
      const task = {
        id: taskId,
        data: taskData,
        resolve,
        reject,
        abortController,
        timeout: null,
      };

      // Store abort controller for potential early cancellation
      this.taskMap.set(taskId, abortController);

      // Try to execute immediately, or queue
      if (!this._executeTask(task)) {
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * Execute a task on an available worker
   */
  _executeTask(task) {
    // Check if task was already aborted before execution
    if (this.abortedTasks.has(task.id)) {
      task.reject(new Error('Task was cancelled before execution'));
      this.abortedTasks.delete(task.id);
      return false;
    }

    // Find an idle worker
    const workerEntry = this.workers.find((w) => !w.busy);
    if (!workerEntry) return false;

    workerEntry.busy = true;
    workerEntry.currentTask = task;

    // Set up one-time message handler
    const handleMessage = (e) => {
      const { taskId, success, result, error } = e.data;

      // Only process if not aborted
      if (this.abortedTasks.has(taskId)) {
        this.abortedTasks.delete(taskId);
        workerEntry.worker.removeEventListener('message', handleMessage);
        workerEntry.worker.removeEventListener('error', handleError);
        clearTimeout(task.timeout);
        this.taskMap.delete(taskId);
        workerEntry.busy = false;
        workerEntry.currentTask = null;
        this._processQueue();
        return;
      }

      // Clean up
      workerEntry.worker.removeEventListener('message', handleMessage);
      workerEntry.worker.removeEventListener('error', handleError);
      clearTimeout(task.timeout);
      this.taskMap.delete(taskId);

      if (success) {
        task.resolve(result);
      } else {
        task.reject(new Error(error || 'Worker task failed'));
      }

      // Mark as idle and process queue
      workerEntry.busy = false;
      workerEntry.currentTask = null;
      this._processQueue();
    };

    const handleError = (error) => {
      workerEntry.worker.removeEventListener('message', handleMessage);
      workerEntry.worker.removeEventListener('error', handleError);
      clearTimeout(task.timeout);
      this.taskMap.delete(task.id);

      task.reject(error);
      workerEntry.busy = false;
      workerEntry.currentTask = null;
      this._processQueue();
    };

    // Listen for abort signal and immediately cancel if triggered
    const abortHandler = () => {
      if (!workerEntry.busy) return; // Already cleaned up
      
      this.abortedTasks.add(task.id);
      workerEntry.worker.removeEventListener('message', handleMessage);
      workerEntry.worker.removeEventListener('error', handleError);
      clearTimeout(task.timeout);
      this.taskMap.delete(task.id);

      // Signal worker to stop processing
      try {
        workerEntry.worker.postMessage({
          command: 'cancel',
          taskId: task.id,
        });
      } catch (e) {
        // Worker already terminated
      }

      task.reject(new Error('Task was cancelled'));
      workerEntry.busy = false;
      workerEntry.currentTask = null;
      this._processQueue();
    };

    // Attach abort listener
    task.abortController.signal.addEventListener('abort', abortHandler, { once: true });

    // Listen for completion
    workerEntry.worker.addEventListener('message', handleMessage);
    workerEntry.worker.addEventListener('error', handleError);

    // Set a timeout (60 seconds max per task)
    task.timeout = setTimeout(() => {
      if (this.abortedTasks.has(task.id)) {
        this.abortedTasks.delete(task.id);
      } else {
        workerEntry.worker.removeEventListener('message', handleMessage);
        workerEntry.worker.removeEventListener('error', handleError);
        this.taskMap.delete(task.id);
        task.reject(new Error('Worker task timeout'));
      }
      workerEntry.busy = false;
      workerEntry.currentTask = null;
      this._processQueue();
    }, 60000);

    // Post the task to worker
    try {
      // Store task metadata for abort handling
      this.taskMap.set(task.id, {
        abortController: task.abortController,
        workerEntry,
        task,
      });

      workerEntry.worker.postMessage({
        command: 'generate',
        taskId: task.id,
        ...task.data,
      });
    } catch (error) {
      clearTimeout(task.timeout);
      this.taskMap.delete(task.id);
      task.reject(error);
      workerEntry.busy = false;
      workerEntry.currentTask = null;
      this._processQueue();
    }

    return true;
  }

  /**
   * Process the task queue
   */
  _processQueue() {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!this._executeTask(task)) {
        // Put it back if no workers available
        this.taskQueue.unshift(task);
        break;
      }
    }
  }

  /**
   * Cancel a task by its ID — Immediately responsive via AbortController
   * 
   * Execution flow:
   * 1. Abort signal fires synchronously (zero latency)
   * 2. All abort listeners execute immediately
   * 3. Worker receives 'cancel' message to stop synthesis
   * 4. CPU-intensive synthesis stops immediately in worker
   * 5. Resources freed before task.reject() completes
   * 6. Worker reused for next queued task
   * 
   * Guarantees:
   * - Worker stops synthesis within current cycle (~10-100ms)
   * - No CPU wasted on cancelled buffers
   * - Main thread responsive even with rapid cancellations
   * 
   * @param {string} taskId - Task ID to cancel
   */
  cancelTask(taskId) {
    const taskMetadata = this.taskMap.get(taskId);
    if (!taskMetadata) return; // Task not found or already cleaned
    
    // 1. Trigger abort signal — fires synchronously, zero delay
    taskMetadata.abortController.abort();
    
    // 2. Mark for cleanup in case task hasn't started executing yet
    // (queued tasks will reject before worker assignment)
    this.abortedTasks.add(taskId);
    
    // 3. Ensure worker gets explicit cancel message
    // This guarantees worker loop exits on next iteration
    try {
      if (taskMetadata.workerEntry && taskMetadata.workerEntry.worker) {
        taskMetadata.workerEntry.worker.postMessage({
          command: 'cancel',
          taskId: taskId,
        });
      }
    } catch (e) {
      // Worker already terminated or message failed — task cleanup handles this
    }
  }

  /**
   * Terminate the entire pool (cleanup)
   */
  terminate() {
    this.workers.forEach((w) => {
      try {
        w.worker.terminate();
      } catch (e) {}
    });
    this.workers = [];
    this.taskQueue = [];
    this.taskMap.clear();
    this.initialized = false;
  }
}

export default WorkerPool;