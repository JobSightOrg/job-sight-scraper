import { Page } from "puppeteer";
import { BrowserService } from "../browser-service";
import DefaultBrowser from "../default-browser";
import { handlePuppeteerError } from "../../lib/handle-puppeteer-error";

interface IMicrosoftBrowser {
  execTask: (url: string, counter: number) => Promise<boolean>;
}

export default class MicrosoftBrowser
  extends DefaultBrowser
  implements IMicrosoftBrowser
{
  private static instance: MicrosoftBrowser | null = null;

  private constructor(private browserService: BrowserService) {
    super();
  }

  public static getInstance(): MicrosoftBrowser {
    if (!MicrosoftBrowser.instance) {
      const browserServiceInstance = new BrowserService();

      MicrosoftBrowser.instance = new MicrosoftBrowser(browserServiceInstance);
    }

    return MicrosoftBrowser.instance;
  }

  public async execTask(url: string): Promise<boolean> {
    let page: Page | null = null;

    try {
      if (!this.browserService.getBrowser())
        await this.browserService.initialize();

      page = await this.browserService.openPage();

      await Promise.all([
        page.goto(url, { waitUntil: "load", timeout: 5000 }),
        page.waitForXPath(
          // "//span[contains(@class, 'ms-Button-label') and contains(@class, 'label-76') and text()='Apply']",
          "//span[contains(@class, 'test') and contains(@class, 'test2') and text()='Apply']",
          { timeout: 5000 }
        ),
      ]);

      return true;
    } catch (err: any) {
      console.error(err);

      await handlePuppeteerError(err, page, this.browserService);
      return false;
    } finally {
      if (page) await this.browserService.closePage(page);
    }
  }
}
