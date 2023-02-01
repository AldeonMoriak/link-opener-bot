import express from "express";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import fetch, { AbortError } from "node-fetch";
import * as dotenv from "dotenv";
dotenv.config();

const AbortController =
  globalThis.AbortController || (await import("abort-controller"));

const controller = new AbortController();
const port = "3000";
const bot = new Telegraf(process.env.BOT_TOKEN);

const app = express();

async function callApi(url) {
  const response = await fetch(url, {
    signal: controller.signal,
  });
  return response.text();
}

async function getApiCall(ctx) {
  const msg = ctx.message.text;
  let url = "";
  let body = "";
  if (msg.split(".").length !== 2) {
    return ctx.reply("آدرست رو درست وارد کن. مثل این: something.antoher_thing \n آدرسی که وارد کردی: " + msg);
  }
  url = "https://" + msg + ".dopraxrocks.net";
  try {
    body = await callApi(url);
    if(!body.includes('Welcome')) {
      await getApiCall(ctx);
    }
  } catch (error) {
    if (error instanceof AbortError) {
      console.log("request was aborted");
      await getApiCall(ctx);
    }
  } 
  return ctx.replyWithMarkdown("سرور بالاست." + "\n\n `"+ msg + "`");
}

bot.start((ctx) =>
  ctx.reply(
    "آدرس دوپراکست رو بده تا رکوئست بدم بهش. بین https و dopraxrocks.net منظورمه"
  )
);
bot.on(message("text"), getApiCall);
bot.launch();

app.get("/", async (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  res.end('hello');
});

app.listen(port, () => {
  console.log(`Link opener app listening on port ${port}`);
});

export default bot;