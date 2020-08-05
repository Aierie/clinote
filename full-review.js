#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const { archivedir, reviewdir } = require('./config.json');

async function getFiles() {
  const files = await fs.promises.readdir(archivedir);
  return files;
}

const getData = async name => {
  return JSON.parse(await fs.promises.readFile(
    path.resolve(archivedir, name),
    { encoding: "utf-8" }
  ));
};

async function writeArchiveToMd() {
  for (let fileName of (await getFiles())) {
    const data = await getData(fileName);
    const noteTitle = path.resolve(reviewdir, data.title);
    const result = `# ${data.title}\n${data.text}\n\n${data.tags.filter(v => v.trim()).map(el => `#${el}`).join(" ")}`
    await fs.writeFile(
      `${noteTitle}.md`,
      result,
      err => err || console.log("wrote file", noteTitle)
    )
  }
}

writeArchiveToMd();