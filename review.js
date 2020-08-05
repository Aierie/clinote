#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");
const chalk = require('chalk');
const { tempdir, dailydir, archivedir } = require('./config.json');

function move(oldPath, newPath, callback) {

    fs.rename(oldPath, newPath, function (err) {
        if (err) {
            if (err.code === 'EXDEV') {
                copy();
            } else {
                callback(err);
            }
            return;
        }
        callback();
    });

    function copy() {
        var readStream = fs.createReadStream(oldPath);
        var writeStream = fs.createWriteStream(newPath);

        readStream.on('error', callback);
        writeStream.on('error', callback);

        readStream.on('close', function () {
            fs.unlink(oldPath, callback);
        });

        readStream.pipe(writeStream);
    }
}

async function getFiles() {
  const files = await fs.promises.readdir(tempdir);

  return files;
}

async function review() {
  const fileNames = await getFiles();
  if (!fileNames.length) {
    console.log("no files to review")
    return;
  }
  const getData = async name => {
    return JSON.parse(await fs.promises.readFile(
      path.resolve(tempdir, name),
      { encoding: "utf-8" }
    ));
  };
  const prompt = async data => {
    console.log(chalk.bold.blue(data.title, ":"), chalk.white(data.text));
    console.log(chalk.white(data.tags));
    const answers = await inquirer.prompt({
      type: "confirm",
      name: "add",
      message: "Add to daily note?"
    });
    return answers.add;
  }

  // tag all dailies as personal
  let tags = ["personal"];
  let result = "# " + new Date().toDateString() + "\n";
  for (let name of fileNames) {
    let data = await getData(name);
    if (await prompt(data)) {
      console.log(chalk.green("added!"));
      result += `- ${data.title}: ${data.text}\n`
      tags.push(...data.tags);
    } else {
      console.log(chalk.grey("skipped!"));
    }
    console.log("\n")
  }
  result += `\n\n${tags.filter((v, i, a) => a.indexOf(v) === i).map(el => `#${el}`).join(" ")}`;

  let startDailyName = path.resolve(dailydir, `${new Date().toDateString().replace(/[^\w]+/g, "-")}`);
  let dailyName = startDailyName
  let counter = 2;
  while (fs.existsSync(`${dailyName}.md`)) {
    dailyName = startDailyName + "-" + counter++
  }
  fs.writeFile(
    `${dailyName}.md`,
    result,
    err => err || console.log("done with review")
  )

  // TODO: compile files into a full json file and move to an archive
  fileNames.forEach(name => {
    move(path.resolve(tempdir, name), path.resolve(archivedir, name), () => console.log("done"));
  })
}

review();