import path from "path";

import { JSDOM } from "jsdom";

import Ponybook, { ContentOptionsFormatter, CssFormatter, HtmlFormatter } from "../src/index";
import { assertBuffer, assertOuput, getOptions } from "./utils";

const HTML_CONTENT = `
<!doctype html>
<html>
<head>
    <title>Example Domain</title>

    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type="text/css">
    @import url(https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css);
    body {
        background-color: #f0f0f2;
        margin: 0;
        padding: 0;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
        
    }
    div {
        width: 600px;
        margin: 5em auto;
        padding: 2em;
        background-color: #fdfdff;
        border-radius: 0.5em;
        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);
    }
    a:link, a:visited {
        color: #38488f;
        text-decoration: none;
    }
    @media (max-width: 700px) {
        div {
            margin: 0 auto;
            width: auto;
        }
    }
    </style>    
</head>

<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div>
</body>
</html>
`;

describe("Convert string to ebook", () => {
    test("and buffer", async () => {
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] buffer",
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.string(HTML_CONTENT, options);

        const buffer = await ponybook.buffer();

        assertBuffer(buffer);
    });

    test("and render", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-render.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] simple render",
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.string(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with options formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-render-with-options-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] render with options formatter",
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

        ponybook.string(HTML_CONTENT, optionsFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with html formatter returning false", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-render-return-false.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] render return false",
            }),
        );

        const options = {
            title: "My super content title",
        };

        const skipDataFormatter: HtmlFormatter = () => false;

        ponybook.string(HTML_CONTENT, options).string(HTML_CONTENT, options, skipDataFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with html formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-render-with-html-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] render with html formatter",
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

        ponybook.string(HTML_CONTENT, options, htmlFormatter);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and render with css formatter", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-render-css-formatter.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] render with css formatter",
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

        ponybook.css(cssFormatter).string(HTML_CONTENT, options);

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and skip 404 image", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-skip-404-image.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] skip 404 image",
                skipImageNotFound: true,
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.string(
            `
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p><img src="https://www.google.com/404-not-exist.jpeg"/></p>
</div>
        `,
            options,
        );

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });

    test("and skip 404 css", async () => {
        const OUTPUT_DIR = path.resolve("./my-book-string-skip-404-css.epub");
        const ponybook = new Ponybook(
            getOptions({
                title: "[string] skip 404 css",
                skipCssNotFound: true,
                resolveCssImportRules: true,
            }),
        );

        const options = {
            title: "My super content title",
        };

        ponybook.string(
            `
        <!doctype html>
        <html>
        <head>
            <title>Example Domain</title>
        
            <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style type="text/css">
            @import url(https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.not.exist.404.min.css);
            </style>    
        </head>
        
        <body>
        <div>
            <h1>Example Domain</h1>
            <p>This domain is for use in illustrative examples in documents. You may use this
            domain in literature without prior coordination or asking for permission.</p>
            <p><a href="https://www.iana.org/domains/example">More information...</a></p>
        </div>
        </body>
        </html>
        `,
            options,
        );

        await ponybook.render(OUTPUT_DIR);

        await assertOuput(OUTPUT_DIR);
    });
});
