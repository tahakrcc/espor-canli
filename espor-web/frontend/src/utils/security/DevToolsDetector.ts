export class DevToolsDetector {
  private checkInterval: number | null = null;
  private onDetect: () => void;

  constructor(onDetect: () => void) {
    this.onDetect = onDetect;
  }

  start() {
    this.checkInterval = window.setInterval(() => {
      if (this.isDevToolsOpen()) {
        this.onDetect();
      }
    }, 1000);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private isDevToolsOpen(): boolean {
    // Yöntem 1: Console.log timing
    const start = performance.now();
    console.log('%c', 'color: transparent');
    const end = performance.now();
    if (end - start > 100) return true;

    // Yöntem 2: Window size kontrolü
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    if (widthThreshold || heightThreshold) return true;

    // Yöntem 3: Debugger tespiti
    let devtools = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        devtools = true;
        return '';
      }
    });
    console.log(element);
    console.clear();

    return devtools;
  }
}

