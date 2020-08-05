#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const inquirer = require('inquirer');

const { tempdir: dir } = require('./config.json');
// const dir = "./test";

inquirer
  .prompt([
    {
      type: 'input',
      name: 'title',
      message: 'title:',
    },
    {
      type: 'input',
      name: 'description',
      message: 'note:',
    },
    {
      type: "input",
      name: "tags",
      message: "tags:"
    }
  ])
  .then(async answers => {
    const content = {
      date: new Date().toISOString(),
      title: answers.title,
      text: answers.description.replace(/\n/, " "),
      tags: answers.tags.split(/\s+/g).filter((v, i, a) => a.indexOf(v) === i)
    };
    const name = path.resolve(dir, `${content.date.replace(/[^\w+]/g, "-")}.json`);

    fs.writeFile(name, JSON.stringify(content), err => err || console.log("note added"))
  });