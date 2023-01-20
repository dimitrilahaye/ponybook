import path from "path";
import Ponybook from "../src/index";
import { assertOuput, getOptions, __dirname } from "./utils";

describe("Convert html to ebook with concurrency", () => {
    test("and render from html", async () => {
        const HTML_CONTENT = "https://example.com/";
        const OUTPUT_DIR = path.resolve("./my-book-url-render-with-concurrency.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[url] simple render with concurrency",
                concurrency: 10,
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options)
            .url(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render from files", async () => {
        const HTML_CONTENT = path.resolve(__dirname, "example.html");
        const OUTPUT_DIR = path.resolve("./my-book-file-render-with-concurrency.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[file] simple render with concurrency",
                concurrency: 10,
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options)
            .file(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });
});
