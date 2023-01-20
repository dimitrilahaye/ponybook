/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

import { EPub, EpubContentOptions, EpubOptions } from "@dimitrilahaye/html-to-epub";
import axios, { AxiosError } from "axios";
import extract from "extract-inline-css";
import { attach, getConfig, RetryConfig } from "retry-axios";
import { concurrencyExecuter } from "rx-queue";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type PonybookOptions = Omit<EpubOptions, "content" | "version" | "output "> & {
    resolveCssImportRules?: boolean;
    concurrency?: number;
    skipUrlNotFound?: boolean;
    skipCssNotFound?: boolean;
};
export type PonybookContentOptions = Omit<EpubContentOptions, "data">;
export type CssFormatter = (css: string | null) => string;
export type HtmlFormatter = (html: string) => string | boolean;
export type ContentOptionsFormatter = (html: string) => PonybookContentOptions;

const info = (verbose: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (...args: any[]): void => {
        if (verbose) {
            console.info(...args);
        }
    };
};

type InternalContentId = number;
type ContentInput = {
    type: "url" | "file" | "string";
    data: string;
    options: PonybookContentOptions | ContentOptionsFormatter;
    formatter?: HtmlFormatter;
    id: InternalContentId;
};
type InternalContent = EpubContentOptions & { id: InternalContentId };

export default class Ponybook {
    private epubOptions: EpubOptions = {
        title: "NO TITLE",
        description: "NO DESC",
        content: [],
    };

    // Ponybook specific options
    private resolveCssImportRules = false;

    private concurrency = 1;

    private retries = 0;

    private retryDelay = 100;

    private rejectUnauthorized = true;

    private readonly contentInputs: ContentInput[] = [];

    private internalContentIdCounter = 0;

    private readonly internalContents: InternalContent[] = [];

    private cssFormatter: CssFormatter | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly info: (...args: any[]) => void;

    private firstLoadedHtml: string | null = null;

    private skipCssNotFound = false;

    private skipUrlNotFound = false;

    constructor(options: PonybookOptions) {
        this.info = info(options.verbose ?? false);
        this.setPonybookOptions(options);
        const tempDir = this.getPonybookTempDirPath(options);
        this.resolveEPubOptions(options, tempDir);
    }

    css(formatter: CssFormatter): this {
        this.cssFormatter = formatter ?? null;

        return this;
    }

    file(
        filePath: string,
        options: PonybookContentOptions | ContentOptionsFormatter,
        formatter?: HtmlFormatter,
    ): this {
        this.internalContentIdCounter++;
        this.contentInputs.push({
            id: this.internalContentIdCounter,
            type: "file",
            data: filePath,
            options,
            formatter,
        });

        return this;
    }

    string(
        html: string,
        options: PonybookContentOptions | ContentOptionsFormatter,
        formatter?: HtmlFormatter,
    ): this {
        this.internalContentIdCounter++;
        this.contentInputs.push({
            id: this.internalContentIdCounter,
            type: "string",
            data: html,
            options,
            formatter,
        });

        return this;
    }

    url(
        url: string,
        options: PonybookContentOptions | ContentOptionsFormatter,
        formatter?: HtmlFormatter,
    ): this {
        this.internalContentIdCounter++;
        this.contentInputs.push({
            id: this.internalContentIdCounter,
            type: "url",
            data: url,
            options,
            formatter,
        });

        return this;
    }

    async render(output: string): Promise<void> {
        try {
            await this.renderEPub(output);
        } catch (e) {
            await this.removeTempDir();
            throw e;
        } finally {
            await this.removeTempDir();
        }
    }

    async buffer(): Promise<Buffer> {
        const output = path.resolve(this.epubOptions.tempDir!, "output.epub");
        try {
            await this.renderEPub(output);

            return fs.promises.readFile(output);
        } catch (e) {
            await this.removeTempDir();
            throw e;
        } finally {
            await this.removeTempDir();
        }
    }

    private async resolveContentInputs(): Promise<void> {
        const urlInputs = this.contentInputs.filter((input) => input.type === "url");
        const urlResults = concurrencyExecuter(this.concurrency)(
            this.resolveUrlContentInput.bind(this),
        )(urlInputs);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _result of urlResults) {
            // wait for task to be finished
        }

        const fileInputs = this.contentInputs.filter((input) => input.type === "file");
        const fileResults = concurrencyExecuter(this.concurrency)(
            this.resolveFileContentInput.bind(this),
        )(fileInputs);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _result of fileResults) {
            // wait for task to be finished
        }

        const stringInputs = this.contentInputs.filter((input) => input.type === "string");
        for await (const input of stringInputs) {
            await this.resolveStringContentInput(input);
        }

        this.epubOptions.content = this.internalContents.sort((a, b) => a.id - b.id);
    }

    private async resolveUrlContentInput({
        id,
        data,
        options,
        formatter,
    }: ContentInput): Promise<void> {
        try {
            attach();
            const raxConfig = this.getRetryConfig(data);
            this.info("[HTML Downloading] Fetch url ", data);
            const response = await axios.get<string>(data, {
                raxConfig,
                timeout: 5000,
                responseType: "text",
                httpsAgent: new https.Agent({
                    rejectUnauthorized: this.rejectUnauthorized,
                }),
            });
            const html = response.data;
            if (html) {
                this.resolvePonybookContentOptions(id, options, formatter, html);
            }
        } catch (err) {
            if (this.skipUrlNotFound && (err as AxiosError).response?.status === 404) {
                this.info("[HTML Skip] Url not found", data);

                return;
            }
            this.info("[Fetch Error]", data, JSON.stringify(err));
            throw err;
        }
    }

    private getRetryConfig(data: string): RetryConfig {
        return {
            retry: this.retries,
            retryDelay: this.retryDelay,
            noResponseRetries: this.retries,
            backoffType: "static",
            onRetryAttempt: (err) => {
                const cfg = getConfig(err);
                this.info(`[Downloading] Retry attempt #${cfg?.currentRetryAttempt} ${data}`);
            },
        };
    }

    private async resolveStringContentInput({
        id,
        data,
        options,
        formatter,
    }: ContentInput): Promise<void> {
        this.resolvePonybookContentOptions(id, options, formatter, data);
    }

    private async resolveFileContentInput({
        id,
        data,
        options,
        formatter,
    }: ContentInput): Promise<void> {
        const html = await fs.promises.readFile(data, "utf-8");
        this.resolvePonybookContentOptions(id, options, formatter, html);
    }

    private resolveEPubOptions(options: PonybookOptions, tempDir: string): void {
        // just keep specific EPubOptions params
        const { resolveCssImportRules, skipUrlNotFound, ...epubOptions } = options;
        this.epubOptions = {
            ...this.epubOptions,
            ...epubOptions,
            tempDir,
        };
    }

    private setPonybookOptions(options: PonybookOptions): void {
        this.resolveCssImportRules = options.resolveCssImportRules ?? false;
        this.concurrency = options.concurrency ?? 1;
        this.retries = options.retries ?? 0;
        this.retryDelay = options.retryDelay ?? 100;
        this.skipUrlNotFound = options.skipUrlNotFound ?? false;
        this.skipCssNotFound = options.skipCssNotFound ?? false;
        this.rejectUnauthorized = options.rejectUnauthorized ?? true;
    }

    private getPonybookTempDirPath(options: PonybookOptions): string {
        const tempDirUuid = uuidv4();
        const tempDir = options.tempDir
            ? path.resolve(options.tempDir, tempDirUuid)
            : path.resolve(__dirname, "..", tempDirUuid);

        return tempDir;
    }

    private resolvePonybookContentOptions(
        id: InternalContentId,
        options: PonybookContentOptions | ContentOptionsFormatter,
        formatter: HtmlFormatter | undefined,
        html: string,
    ): void {
        if (this.internalContents.length === 0) {
            this.firstLoadedHtml = html;
        }
        const data = formatter ? formatter(html) : html;
        if (!data) {
            return;
        }
        if (typeof options === "function") {
            this.internalContents.push({
                id,
                data: data as string,
                ...options(data as string),
            });
        }
        if (typeof options === "object") {
            this.internalContents.push({
                id,
                data: data as string,
                ...options,
            });
        }
    }

    private async extractCss(): Promise<string | null> {
        if (this.epubOptions.content.length > 0) {
            const fullPath = path.resolve(this.epubOptions.tempDir!, "html_file.html");
            await fs.promises.writeFile(fullPath, this.firstLoadedHtml as string);
            const res = extract(fullPath, {
                out: "object",
                keepStyleAttribute: true,
                keepStyleTags: true,
                extractGlobalStyles: true,
            });
            if (res?.css) {
                // todo CSS should be minified!!!
                if (!this.resolveCssImportRules) {
                    return res.css;
                }

                return this.resolveImportRules(res.css);
            }

            return null;
        }

        return null;
    }

    private async resolveImportRules(css: string): Promise<string> {
        attach();
        const importLinkRegex =
            /(?=['"])|(?:@import url\(['"])(?<name>.*)(?:['"]\);)|(?:@import url\()(?<name2>.*)(?:\);)/gi;
        const importsLinks = Array.from(css.matchAll(importLinkRegex));
        // const importedCss = await Promise.all(
        let importedCss = "";
        for (const link of importsLinks) {
            const url = link.groups?.name ?? link.groups?.name2;
            if (url) {
                try {
                    const raxConfig = this.getRetryConfig(url);
                    this.info("[CSS Downloading] Fetch url ", url);
                    // eslint-disable-next-line no-await-in-loop
                    const response = await axios.get<string>(url, {
                        raxConfig,
                        timeout: 50000,
                        responseType: "text",
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: this.rejectUnauthorized,
                        }),
                    });

                    importedCss += `\n${response.data}`;
                } catch (err) {
                    if (this.skipCssNotFound && (err as AxiosError).response?.status === 404) {
                        this.info("[CSS Skip] Url not found", url);
                        continue;
                    }
                    this.info("[Fetch CSS error]", url, err);
                    throw err;
                }
            }
        }

        return `${importedCss}${css}`;
    }

    private async launchCssFormatter(): Promise<void> {
        if (this.cssFormatter !== null) {
            const css = await this.extractCss();
            this.epubOptions.css = this.cssFormatter(css);
        }
    }

    private async createTempDir(): Promise<void> {
        await fs.promises.mkdir(this.epubOptions.tempDir!);
    }

    private async removeTempDir(): Promise<void> {
        await fs.promises.rm(this.epubOptions.tempDir!, { recursive: true, force: true });
    }

    private async renderEPub(output: string): Promise<void> {
        await this.createTempDir();
        await this.resolveContentInputs();
        await this.launchCssFormatter();

        const epub = new EPub(this.epubOptions, output);

        await epub.render();
    }
}
