import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PonybookOptions } from "../src/index";

const __filename = fileURLToPath(import.meta.url);

export const __dirname = path.dirname(__filename);

const TMP_DIR = path.resolve(__dirname);

const COVER = path.resolve(__dirname, "logo.png");
const baseOptions: PonybookOptions = {
    title: "[file] buffer",
    description: "A test",
    cover: COVER,
    tempDir: TMP_DIR,
    verbose: true,
    css: "p {color: red;}",
};

export const getOptions = (options: Partial<PonybookOptions>): PonybookOptions => ({
    ...baseOptions,
    ...options,
});

export const assertBuffer = (buffer: Buffer) => expect(buffer).toBeDefined();

export const assertOuput = async (ouput: string) => {
    const ebook = await fs.promises.readFile(ouput);
    expect(ebook).toBeDefined();
};
