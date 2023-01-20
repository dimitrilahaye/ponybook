
# @dimitrilahaye/ponybook

<img src="logo.png" alt="drawing" width="50"/>

## What is it?

Ponybook converts html contents into ebook. Each content can come from an url, a file or a string.

Unlike similar node libs, this one is not built around [Calibre package](https://calibre-ebook.com/). It is a standalone library wrapping [@dimitrilahaye/html-to-epub](https://github.com/dimitrilahaye/html-to-epub) which generate an ebook from scratch.


---


# Table of contents

  - [How to use it?](#how-to-use-it)
  - [Builder PonybookOptions](#builder-ponybookoptions)
  - [Content PonybookContentOptions](#content-ponybookcontentoptions)
  - [Use ContentOptionsFormatter](#use-contentoptionsformatter)
  - [Use HtmlFormatter](#use-htmlformatter)
  - [Use CssFormatter](#use-cssformatter)


---


<img src="logo.png" alt="drawing" width="50"/>

## How to use it?

### Install it

```bash
npm install @dimitrilahaye/ponybook
# or
yarn add @dimitrilahaye/ponybook
```

### Get the ponybook builder

```typescript
import Ponybook, { PonybookOptions } from '@dimitrilahaye/ponybook';

const options: PonybookOptions = {
    title: "My brand new book",
    description: "It is my book I am so proud of it",
    publisher: "Myself",
    author: "Me, again",
    cover: "~/absolute/path/to/assets/img/cover.jpg", // (absolute path)
};

const builder = new Ponybook(options);
```

### Build a basic ebook

```typescript
import Ponybook, { PonybookContentOptions } from '@dimitrilahaye/ponybook';

//...

// aggregate content
builder
    .string("<h1>Super title</h1>", {
        title: "Chapter built from a html string",
    })
    .file("./index.html", {
        title: "Another chapter, but built from a html file",
    })
    .url("https://example.com", {
        title: "Yet another chapter, but built from an url's html content",
    });

// render your ebook at given output path (relative or absolute path)
await builder.render("./path/to/generated-book.epub");

// OR return Buffer

const ebook: Buffer = await builder.buffer();
```

<img src="logo.png" alt="drawing" width="50"/>

## Builder PonybookOptions

| param  | type  | description  | default |
|---:|:---:|:---|:---|
| title  | `string` | Title of the book  | |
| description  | `string` | Description of the book  | |
| date *(optional)*  | `string` | Date of publication  | `Date now with ISO format` |
| tempDir *(optional)*  | `string` | Path where Ponybook will create its temporary folder (removed after operations)  ||
| author *(optional)*  |  `string` `string[]`| Name of the author for the book, string or array, eg. `"Alice"` or `["Alice", "Bob"]`  | `["anonymous"]` |
| publisher *(optional)*  |  `string`| Publisher name  | `"anonymous"` |
|  cover *(optional)* |  `string`| Book cover image, File path (absolute path) or web url, eg. `"http://abc.com/book-cover.jpg"` or `"/User/Alice/images/book-cover.jpg"`  | `null` |
| css *(optional)*  |  `string`| If you really hate our css, you can pass css string to replace our default style. eg: `"body{background: #000}"`. :warning: See CssFormatter part for more details  | `null` |
| resolveCssImportRules *(optional)* | `boolean` | If option is set to `true` and given css contains `@import` rules, ponybook will fetch each `@import` url to add css content to yours.  :warning: See CssFormatter part for more details | `false` |
| verbose *(optional)*  |  `boolean`| specify wheteher or not to console.info progress messages  | `false` |
| fonts *(optional)*  | `string[]` | Array of (absolute) paths to custom fonts to include on the book so they can be used on custom css. :warning: See Fonts usage part for more details | `[]` |
|  lang *(optional)* |  `string`|  lang: Language of the book in 2 letters code. | `en` |
| rejectUnauthorized *(optional)*  | `boolean` | If `rejectUnauthorized` is set to `false`, certificate validation is disabled for TLS connections. :warning: This makes TLS, and HTTPS by extension, insecure. The use of this environment variable is strongly discouraged.  | `true` |
| retries *(optional)*  | `number` | On html and images downloads, ask to retry `n` times each failed request. | `0` |
| retryDelay *(optional)*  | `number` | On html and images downloads, the amount of time (in ms) to initially delay the retry. Not taken into account if `retries` has been setted at `0`. | `100` |
| concurrency *(optional)*  | `number` | Process in parallel `n` html contents from urls and files. | `1` (which means contents will be processed sequentially.) |
| skipImageNotFound *(optional)*  | `boolean` | If setted to `true`, ignores images or cover loaded from url when the response has a 404 code. If setted to `false`, falls on error. | `false` |
| skipUrlNotFound *(optional)*  | `boolean` | If setted to `true`, ignores html content url when the response has a 404 code. If setted to `false`, falls on error. | `false` |
| skipCssNotFound *(optional)*  | `boolean` | If setted to `true`, ignores CSS content url when the response has a 404 code. If setted to `false`, falls on error. | `false` |
| tocTitle *(optional)*  | `string` | Title of the table of contents.  | `"Table Of Contents"` |
|  appendChapterTitles *(optional)* |  `boolean`| Automatically append the chapter title at the beginning of each contents.  | `true` |
| customOpfTemplatePath *(optional)*  | `string` | For advanced customizations: absolute path to an OPF template.  | `null` |
|  customNcxTocTemplatePath *(optional)* | `string` | For advanced customizations: absolute path to a NCX toc template.  | `null` |
| customHtmlTocTemplatePath *(optional)*  | `string`  |  For advanced customizations: absolute path to a HTML toc template. | `null` |

### Fonts usage

With `PonybookOptions` `fonts` param, if you configure the array to fonts: `['/path/to/Merriweather.ttf']`, you can use the following on the `PonybookOptions` `css` param:

```css
@font-face {
    font-family: "Merriweather";
    font-style: normal;
    font-weight: normal;
    src : url("./fonts/Merriweather.ttf");
}
```

<img src="logo.png" alt="drawing" width="50"/>

## Content PonybookContentOptions

| param  | type  | description  | default |
|---:|:---:|:---|:---|
|  title | `string`  | Chapter title  |  |
| author *(optional)*  | `string`  |  if each book author is different, you can fill it. | `""`  |
| excludeFromToc *(optional)*  | `boolean`  | if is not shown on Table of content  | `false`  |
| beforeToc *(optional)*  | `boolean`  | if is shown before Table of content, such like copyright pages.  |  `false` |
| filename *(optional)*  |  `string` | specify filename for each chapter.  | `undefined`  |

<img src="logo.png" alt="drawing" width="50"/>

## Use ContentOptionsFormatter

`ContentOptionsFormatter` is a callback which give you access to the html content you're processing. It allows you to build then return `PonybookContentOptions` according to the current content.

```typescript
const optionsFormatter: ContentOptionsFormatter = (html) => {
    // we assume you are using jsdom
    const dom = new JSDOM(html);
    const author = dom.window.document.querySelector("h1")?.textContent ?? "";

    return {
        title: "My super content title",
        author,
    };
};

ponybook.file(HTML_CONTENT, optionsFormatter);
```

## Use HtmlFormatter

`HtmlFormatter` is a callback which give you access to the html content you're processing. It allows you to modify the content before to return it.

```typescript
const htmlFormatter: HtmlFormatter = (html: string) => {
    return `
        ${html}
        <a href="https://example.com/">Hello!</a>
    `;
};

ponybook.file(HTML_CONTENT, options, htmlFormatter);
```

You may use `HtmlFormatter` in order to filter which content will be added to the ebook and which will not. Simply return false for content to skip.

```typescript
const htmlFormatter: HtmlFormatter = (html: string) => {
    const dom = new JSDOM(html);
    const author = dom.window.document.querySelector("h1")?.textContent;

    if (!author) {
        return false;
    }

    return `
        ${html}
        <a href="https://example.com/">Hello!</a>
    `;
};

ponybook.file(HTML_CONTENT, options, htmlFormatter);
```

<img src="logo.png" alt="drawing" width="50"/>

## Use CssFormatter

`CssFormatter` is a callback which give you access to css from the **first added** html content. It allows you to modify it before to return it.

It is used in order to set the final css which will be used as css file for the rendered ebook.

```typescript
const cssFormatter: CssFormatter = (css) => {
    return `
        ${css}
        h1 { color: blue !important; }
    `;
};

ponybook.css(cssFormatter).file(HTML_CONTENT, options);
```

You can call `builder.css` method at any part of your building process. The `CssFormatter` will always take as argument the css from the first html content you added.

:warning: When you use `CssFormatter`, it will override the `css` param you may have setted into builder `PonybookOptions`.

:warning: In the builder `PonybookOptions`, `resolveCssImportRules` param will process only if you use `CssFormatter`.