import { promises as fsPromises } from "fs";
import puppeteer, { Browser, HTTPResponse, Page } from "puppeteer";
import useProxy from "puppeteer-page-proxy";
import { ResponseError } from "../lib/custom-errors";

interface ProxyData {
  proxies: string[];
}

export interface IBrowserService {
  getBrowser: () => Browser | null;
  initialize: () => Promise<void>;
  openPage: () => Promise<Page>;
  closePage: (page: Page) => Promise<void>;
  restartBrowser: () => Promise<void>;
}

export class BrowserService implements IBrowserService {
  private browser: Browser | null = null;
  private browserInitialization: Promise<Browser> | null = null;
  private isInitializingBrowser: boolean = false;
  private headers: {
    "accept-encoding": string;
    "accept-language": string;
    "user-agent": string;
  };

  public constructor() {
    this.headers = {
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "user-agent": this.getRandomUA(),
    };
  }

  /**
   * Return browser variable.
   */
  public getBrowser(): Browser | null {
    return this.browser;
  }

  /**
   * Open a page.
   */
  public async openPage(): Promise<Page> {
    this.checkBrowser();

    const page = await this.browser!.newPage();

    await page.setExtraHTTPHeaders(this.headers);
    // await useProxy(page, this.loadProxy());

    return page;
  }

  /**
   * Close a page.
   */
  public async closePage(page: Page): Promise<void> {
    this.checkBrowser();

    await page.close();
  }

  /**
   * Restart browser.
   */
  public async restartBrowser(): Promise<void> {
    this.checkBrowser();

    let openPages = await this.browser!.pages();

    while (openPages.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      openPages = await this.browser!.pages();
    }

    await this.browser!.close();
    this.browser = null;
    this.browserInitialization = null;
    await this.initialize();
  }

  /**
   * Initialize the instance.
   */
  public async initialize(): Promise<void> {
    try {
      if (!this.browserInitialization) {
        this.browserInitialization = puppeteer.launch({
          headless: false,
          args: [
            "--no-sandbox", // Disable sandboxing for faster launch (use with caution)
            "--disable-dev-shm-usage", // Disable /dev/shm usage
            "--disable-setuid-sandbox", // Disable setuid sandbox (use with caution)
          ],
        });
        this.isInitializingBrowser = true;
      }

      if (this.isInitializingBrowser) {
        this.browser = await this.browserInitialization;
        this.isInitializingBrowser = false;
      }
    } catch (error: any) {
      console.error("Error initializing browser");
      throw error;
    }
  }

  private async loadProxy(): Promise<string> {
    try {
      // Read the contents of the file asynchronously
      const data = await fsPromises.readFile("proxies.json", "utf8");
      const parsedData: ProxyData = JSON.parse(data);

      return parsedData.proxies[0];
    } catch (error) {
      console.error("Error reading the file:", error);
    }

    return "";
  }

  /**
   * Check if browser exists
   */
  private checkBrowser() {
    if (!this.browser) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }
  }

  /**
   * Get random user agent
   */
  private getRandomUA() {
    const userAgents = [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.9999.99 Safari/537.36 Edg/99.0.999.99",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0",
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
}
