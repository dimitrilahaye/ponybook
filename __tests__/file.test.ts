import path from "path";

import { JSDOM } from "jsdom";

import Ponybook, { ContentOptionsFormatter, CssFormatter, HtmlFormatter } from "../src/index";
import { assertBuffer, assertOuput, getOptions, __dirname } from "./utils";

const HTML_CONTENT = path.resolve(__dirname, "example.html");

describe("Convert file to ebook", () => {
    test("and buffer", async () => {
        const ponybook = new Ponybook(
            getOptions({
                title: "[file] buffer",
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.file(HTML_CONTENT, options);

        const buffer = await ponybook.buffer();

        assertBuffer(buffer);
    });

    test("and render", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-file-render.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[file] simple render",
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.file(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with options formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-file-render-with-options-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[file] render with options formatter",
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

        ponybook.file(HTML_CONTENT, optionsFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with html formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-file-render-with-html-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[file] render with html formatter",
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

        ponybook.file(HTML_CONTENT, options, htmlFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with css formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-file-render-css-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[file] render with css formatter",
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

        ponybook.css(cssFormatter).file(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });
});
