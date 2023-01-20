import path from "path";

import { JSDOM } from "jsdom";

import Ponybook, { CssFormatter, ContentOptionsFormatter, HtmlFormatter } from "../src/index";
import { assertBuffer, assertOuput, getOptions } from "./utils";

const HTML_CONTENT = "https://example.com/";

describe("Convert url to ebook", () => {
    test("and buffer", async () => {
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] buffer",
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.url(HTML_CONTENT, options);

        const buffer = await ponybook.buffer();

        assertBuffer(buffer);
    });

    test("and render", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-url-render.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] simple render",
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.url(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with options formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-url-render-with-options-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] render with options formatter",
            }),
        );

        const optionsFormatter: ContentOptionsFormatter = (html) => {
            // todo put jsdom in the dev deps
            const dom = new JSDOM(html);
            const author = dom.window.document.querySelector("h1")?.textContent ?? "";

            return {
                title: "My super content title",
                author,
            };
        };

        ponybook.url(HTML_CONTENT, optionsFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with html formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-url-render-with-html-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] render with html formatter",
            }),
        );

        const options = {
            title: "My super content title",
        };

        const htmlFormatter: HtmlFormatter = (html: string) => {
            return `
        ${html}
        <a href="https://example.com/">Hello!</a>
        `;
        };

        ponybook.url(HTML_CONTENT, options, htmlFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with css formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-url-render-css-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] render with css formatter",
            }),
        );

        const cssFormatter: CssFormatter = (css) => {
            return `
                ${css}
                h1 { color: blue !important; }
            `;
        };

        const options = {
            title: "My super content title",
        };

        ponybook.css(cssFormatter).url(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render by skipping 404 url", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-url-skipping-404-url.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] skipping 404 url",
                skipUrlNotFound: true,
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.url("https://www.google.com/404-not-exist.html", options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });
});
